import { IStorage } from './storage-interface.js';

export class IndexedDBStorage extends IStorage {
  #db = null;
  #storeName = 'records';
  #initPromise = null;

  constructor(name, version = 1) {
    super();
    this.name = name;
    this.version = version;
  }

  async ensureInitialized() {
    if (this.#db) return;

    if (this.#initPromise) {
      return this.#initPromise;
    }

    this.#initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => {
        this.#initPromise = null;
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.#db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.#storeName)) {
          db.createObjectStore(this.#storeName, { keyPath: 'id' });
        }
      };
    });

    return this.#initPromise;
  }

  #getStore(mode = 'readonly') {
    const transaction = this.#db.transaction([this.#storeName], mode);
    return transaction.objectStore(this.#storeName);
  }

  #promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async create(record) {
    if (!record.id) throw new Error('Record must have an id');

    await this.ensureInitialized();

    const existing = await this.read(record.id);
    if (existing) throw new Error(`Record with id '${record.id}' already exists`);

    const store = this.#getStore('readwrite');
    const request = store.add(record);
    await this.#promisifyRequest(request);
    
    return record.id;
  }

  async read(id) {
    await this.ensureInitialized();

    const store = this.#getStore('readonly');
    const request = store.get(id);
    const result = await this.#promisifyRequest(request);
    
    return result || null;
  }

  async readAll() {
    await this.ensureInitialized();

    const store = this.#getStore('readonly');
    const request = store.getAll();
    
    return await this.#promisifyRequest(request);
  }

  async update(id, updates) {
    await this.ensureInitialized();

    const existing = await this.read(id);
    if (!existing) throw new Error(`Record with id '${id}' not found`);

    const updatedRecord = { ...existing, ...updates, id }; 
    
    const store = this.#getStore('readwrite');
    const request = store.put(updatedRecord);
    await this.#promisifyRequest(request);
    
    return updatedRecord;
  }

  async delete(id) {
    await this.ensureInitialized();

    const exists = await this.exists(id);
    if (!exists) return false;

    const store = this.#getStore('readwrite');
    const request = store.delete(id);
    await this.#promisifyRequest(request);
    
    return true;
  }

  async deleteAll() {
    await this.ensureInitialized();

    const count = await this.count();
    
    const store = this.#getStore('readwrite');
    const request = store.clear();
    await this.#promisifyRequest(request);
    
    return count;
  }

  async exists(id) {
    await this.ensureInitialized();

    const store = this.#getStore('readonly');
    const request = store.count(id);
    const count = await this.#promisifyRequest(request);
    
    return count > 0;
  }

  async count() {
    await this.ensureInitialized();

    const store = this.#getStore('readonly');
    const request = store.count();
    
    return await this.#promisifyRequest(request);
  }

  getName() {
    return this.name;
  }

  getType() {
    return 'indexeddb';
  }

  async close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
  }
}

export async function createIndexedDBStorage(name, version = 1) {
  const storage = new IndexedDBStorage(name, version);
  await storage.ensureInitialized();
  return storage;
}
