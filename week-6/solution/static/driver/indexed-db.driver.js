import { Driver } from "./driver.js";
import { createSharedPromise } from "./utility/shared-promise.js";

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
          results.sort((a, b) => {
            const { field, direction = "asc" } =
              typeof sort === "string"
                ? { field: sort, direction: "asc" }
                : sort;

            const aVal = this.getNestedValue(a, field);
            const bVal = this.getNestedValue(b, field);

            let comparison = 0;
            if (aVal > bVal) comparison = 1;
            if (aVal < bVal) comparison = -1;

            return direction === "desc" ? -comparison : comparison;
          });
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

  async querySimple(storeName, filterFn) {
    return this.query(storeName, { filter: filterFn });
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  close() {
    if (!this.db) return;
    this.db.close();
    this.db = null;
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
