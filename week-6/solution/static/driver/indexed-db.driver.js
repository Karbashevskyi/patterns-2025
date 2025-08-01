import { Driver } from "./driver.js";
import { createSharedPromise } from "./utility/shared-promise.js";
import { sortArray, getNestedValue } from "./utility/sort.helper.js";

export class IndexedDBDriver extends Driver {
  constructor(
    configuration = {
      dbName: "example",
      version: 1,
      schema: {},
    }
  ) {
    super();
    const { dbName, version, schema } = configuration;
    this.dbName = dbName;
    this.version = version;
    this.schema = schema;
    this.dbAsync = createSharedPromise(() => this.#openDatabase(), {
      once: true,
    });
  }

  async executeTransaction(storeName, mode, operation) {
    const { promise, resolve, reject } = Promise.withResolvers();
    const db = await this.dbAsync;
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    try {
      const result = operation(store);
      if (result && result.onsuccess !== undefined) {
        result.onsuccess = () => resolve(result.result);
        result.onerror = () => reject(result.error);
      }
    } catch (error) {
      reject(error);
    }

    return promise;
  }

  async add(storeName, data) {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      return store.add(data);
    });
  }

  async get(storeName, key) {
    return this.executeTransaction(storeName, "readonly", (store) => {
      return store.get(key);
    });
  }

  async getAll(storeName) {
    return this.executeTransaction(storeName, "readonly", (store) => {
      return store.getAll();
    });
  }

  async update(storeName, data) {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      return store.put(data);
    });
  }

  async delete(storeName, key) {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      return store.delete(key);
    });
  }

  async query(storeName, options = {}) {
    const { filter = () => true, sort = null } = options;

    const { promise, resolve, reject } = Promise.withResolvers();
    const db = await this.dbAsync;
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();
    const results = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) {
        if (sort) {
          sortArray(results, sort);
        }

        resolve(results);
        return;
      }

      const record = cursor.value;
      if (filter(record)) {
        results.push(record);
      }
      cursor.continue();
    };

    request.onerror = () => reject(request.error);
    return promise;
  }

  async* openCursor(storeName, options = {}) {
    const { range = null, direction = "next", indexName = null } = options;
    
    const db = await this.dbAsync;
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    
    // Use index if specified, otherwise use the object store directly
    const source = indexName ? store.index(indexName) : store;
    const request = source.openCursor(range, direction);

    while (true) {
      const cursor = await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });

      if (!cursor) {
        return;
      }

      if (cursor.value !== undefined) {
        yield cursor.value;
        cursor.continue();
      }
    }
  }

  async* iterateAll(storeName) {
    yield* this.openCursor(storeName);
  }

  async* iterateFiltered(storeName, filterFn) {
    for await (const record of this.openCursor(storeName)) {
      if (filterFn(record)) {
        yield record;
      }
    }
  }

  async close() {
    const db = await this.dbAsync;
    if (!db) return;
    db.close();
    this.dbAsync.clear();
    this.dbAsync = null;
  }

  #openDatabase() {
    const { promise, resolve, reject } = Promise.withResolvers();
    const request = indexedDB.open(this.dbName, this.version);

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const { 0: storeName, 1: config } of Object.entries(this.schema)) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, config);
          if (config.indexes) {
            for (const {0: indexName, 1: indexConfig} of Object.entries(
              config.indexes
            )) {
              store.createIndex(indexName, indexConfig.keyPath, indexConfig);
            }
          }
        }
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);
    return promise;
  }

  static create(
    configuration = {
      dbName: "DefaultDB",
      version: 1,
      schema: {},
    }
  ) {
    const driver = new IndexedDBDriver(configuration);
    return driver;
  }
}
