export class IStorage {

  async create(record) {
    throw new Error('Method create() must be implemented');
  }

  async read(id) {
    throw new Error('Method read() must be implemented');
  }

  async readAll() {
    throw new Error('Method readAll() must be implemented');
  }

  async update(id, updates) {
    throw new Error('Method update() must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete() must be implemented');
  }

  async deleteAll() {
    throw new Error('Method deleteAll() must be implemented');
  }

  async exists(id) {
    throw new Error('Method exists() must be implemented');
  }

  async count() {
    throw new Error('Method count() must be implemented');
  }

  getName() {
    throw new Error('Method getName() must be implemented');
  }

  getType() {
    throw new Error('Method getType() must be implemented');
  }

  async close() {
    throw new Error('Method close() must be implemented');
  }
}


export const StorageCapabilities = {
  hasOPFS() {
    return typeof navigator !== 'undefined' && 
           'storage' in navigator && 
           'getDirectory' in navigator.storage;
  },

  hasIndexedDB() {
    return typeof indexedDB !== 'undefined';
  },

  getAvailableTypes() {
    const types = [];
    if (this.hasIndexedDB()) types.push('indexeddb');
    if (this.hasOPFS()) types.push('opfs');
    return types;
  },

  getRecommended() {
    if (this.hasIndexedDB()) return 'indexeddb';
    if (this.hasOPFS()) return 'opfs';
    return null;
  }
};
