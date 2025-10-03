/**
 * Week 10: IndexedDB Storage Adapter
 * 
 * Implementation of IStorage using IndexedDB.
 * Stores records in an object store with 'id' as the key path.
 */

import { IStorage } from './storage-interface.js';

/**
 * IndexedDB Storage Implementation
 * Uses IndexedDB for browser-side structured data storage
 */
export class IndexedDBStorage extends IStorage {
  /**
   * @param {string} name - Storage name (used as database name)
   * @param {number} version - Database version (default: 1)
   */
  constructor(name, version = 1) {
    super();
    this.name = name;
    this.version = version;
    this.db = null;
    this.storeName = 'records'; // Object store name
  }

  /**
   * Initialize IndexedDB
   * @private
   */
  async _ensureInitialized() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Use 'id' as the key path (primary key)
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Get transaction for the object store
   * @private
   * @param {'readonly'|'readwrite'} mode - Transaction mode
   * @returns {IDBObjectStore} Object store
   */
  _getStore(mode = 'readonly') {
    const transaction = this.db.transaction([this.storeName], mode);
    return transaction.objectStore(this.storeName);
  }

  /**
   * Wrap IndexedDB request in a Promise
   * @private
   * @param {IDBRequest} request - IndexedDB request
   * @returns {Promise<any>} Promise that resolves with the result
   */
  _promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // IStorage interface implementation

  async create(record) {
    if (!record.id) {
      throw new Error('Record must have an id');
    }

    await this._ensureInitialized();

    // Check if record already exists
    const existing = await this.read(record.id);
    if (existing) {
      throw new Error(`Record with id '${record.id}' already exists`);
    }

    const store = this._getStore('readwrite');
    const request = store.add(record);
    await this._promisifyRequest(request);
    
    return record.id;
  }

  async read(id) {
    await this._ensureInitialized();

    const store = this._getStore('readonly');
    const request = store.get(id);
    const result = await this._promisifyRequest(request);
    
    return result || null;
  }

  async readAll() {
    await this._ensureInitialized();

    const store = this._getStore('readonly');
    const request = store.getAll();
    
    return await this._promisifyRequest(request);
  }

  async update(id, updates) {
    await this._ensureInitialized();

    const existing = await this.read(id);
    if (!existing) {
      throw new Error(`Record with id '${id}' not found`);
    }

    const updatedRecord = { ...existing, ...updates, id }; // Ensure id is not changed
    
    const store = this._getStore('readwrite');
    const request = store.put(updatedRecord);
    await this._promisifyRequest(request);
    
    return updatedRecord;
  }

  async delete(id) {
    await this._ensureInitialized();

    // Check if record exists
    const exists = await this.exists(id);
    if (!exists) {
      return false;
    }

    const store = this._getStore('readwrite');
    const request = store.delete(id);
    await this._promisifyRequest(request);
    
    return true;
  }

  async deleteAll() {
    await this._ensureInitialized();

    const count = await this.count();
    
    const store = this._getStore('readwrite');
    const request = store.clear();
    await this._promisifyRequest(request);
    
    return count;
  }

  async exists(id) {
    await this._ensureInitialized();

    const store = this._getStore('readonly');
    const request = store.count(id);
    const count = await this._promisifyRequest(request);
    
    return count > 0;
  }

  async count() {
    await this._ensureInitialized();

    const store = this._getStore('readonly');
    const request = store.count();
    
    return await this._promisifyRequest(request);
  }

  getName() {
    return this.name;
  }

  getType() {
    return 'indexeddb';
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Factory function to create IndexedDB storage
 * @param {string} name - Storage name
 * @param {number} version - Database version (default: 1)
 * @returns {Promise<IndexedDBStorage>} Initialized IndexedDB storage instance
 */
export async function createIndexedDBStorage(name, version = 1) {
  const storage = new IndexedDBStorage(name, version);
  await storage._ensureInitialized();
  return storage;
}
