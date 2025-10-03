/**
 * Week 10: Storage Interface
 * 
 * Common interface for all storage implementations.
 * Follows Interface Segregation Principle - small, focused interface.
 */

/**
 * @typedef {Object} StorageRecord
 * @property {string} id - Primary key
 * @property {*} [key] - Any additional properties
 */

/**
 * @interface IStorage
 * 
 * Storage interface for simple CRUD operations.
 * All implementations must provide these methods.
 */
export class IStorage {
  /**
   * Create a new record
   * @param {StorageRecord} record - Record to create (must include id)
   * @returns {Promise<string>} The id of created record
   * @throws {Error} If record with id already exists
   */
  async create(record) {
    throw new Error('Method create() must be implemented');
  }

  /**
   * Read a single record by id
   * @param {string} id - The record id
   * @returns {Promise<StorageRecord|null>} The record or null if not found
   */
  async read(id) {
    throw new Error('Method read() must be implemented');
  }

  /**
   * Read all records
   * @returns {Promise<StorageRecord[]>} Array of all records
   */
  async readAll() {
    throw new Error('Method readAll() must be implemented');
  }

  /**
   * Update an existing record
   * @param {string} id - The record id
   * @param {Partial<StorageRecord>} updates - Fields to update
   * @returns {Promise<StorageRecord>} The updated record
   * @throws {Error} If record not found
   */
  async update(id, updates) {
    throw new Error('Method update() must be implemented');
  }

  /**
   * Delete a record by id
   * @param {string} id - The record id
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    throw new Error('Method delete() must be implemented');
  }

  /**
   * Delete all records
   * @returns {Promise<number>} Number of records deleted
   */
  async deleteAll() {
    throw new Error('Method deleteAll() must be implemented');
  }

  /**
   * Check if a record exists
   * @param {string} id - The record id
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    throw new Error('Method exists() must be implemented');
  }

  /**
   * Count total records
   * @returns {Promise<number>} Total number of records
   */
  async count() {
    throw new Error('Method count() must be implemented');
  }

  /**
   * Get storage name/identifier
   * @returns {string} Storage name
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * Get storage type (opfs, indexeddb, etc.)
   * @returns {string} Storage type
   */
  getType() {
    throw new Error('Method getType() must be implemented');
  }

  /**
   * Close/cleanup storage resources
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method close() must be implemented');
  }
}

/**
 * Storage capability detection
 */
export class StorageCapabilities {
  /**
   * Check if OPFS is available
   * @returns {boolean}
   */
  static hasOPFS() {
    return typeof navigator !== 'undefined' && 
           'storage' in navigator && 
           'getDirectory' in navigator.storage;
  }

  /**
   * Check if IndexedDB is available
   * @returns {boolean}
   */
  static hasIndexedDB() {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Get available storage types
   * @returns {string[]} Array of available storage types
   */
  static getAvailableTypes() {
    const types = [];
    if (this.hasIndexedDB()) types.push('indexeddb');
    if (this.hasOPFS()) types.push('opfs');
    return types;
  }

  /**
   * Get recommended storage type for current environment
   * @returns {string|null} Recommended storage type or null if none available
   */
  static getRecommended() {
    // Prefer IndexedDB for better browser support
    if (this.hasIndexedDB()) return 'indexeddb';
    if (this.hasOPFS()) return 'opfs';
    return null;
  }
}
