import { IndexedDBDriver } from './driver/indexed-db.driver.js';

/**
 * Database class that acts as a provider for different database drivers
 * This implements the Strategy/Provider pattern to allow switching between different storage mechanisms
 */
export class Database {
    
    constructor(driver = null) {
        this.driver = driver;
    }

    /**
     * Set the database driver
     * @param {Driver} driver - The database driver to use
     */
    setDriver(driver) {
        this.driver = driver;
    }

    /**
     * Add a record to the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} data - Data to add
     * @returns {Promise<any>} Promise that resolves with the result
     */
    async add(storeName, data) {
        return this.driver.add(storeName, data);
    }

    /**
     * Get a record by key from the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} key - Key to search for
     * @returns {Promise<any>} Promise that resolves with the record
     */
    async get(storeName, key) {
        return this.driver.get(storeName, key);
    }

    /**
     * Get all records from the specified store/table
     * @param {string} storeName - Name of the store/table
     * @returns {Promise<Array>} Promise that resolves with array of records
     */
    async getAll(storeName) {
        return this.driver.getAll(storeName);
    }

    /**
     * Update a record in the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} data - Data to update
     * @returns {Promise<any>} Promise that resolves with the result
     */
    async update(storeName, data) {
        return this.driver.update(storeName, data);
    }

    /**
     * Delete a record by key from the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} key - Key of the record to delete
     * @returns {Promise<any>} Promise that resolves with the result
     */
    async delete(storeName, key) {
        return this.driver.delete(storeName, key);
    }

    /**
     * Query records with filtering, sorting, and pagination
     * @param {string} storeName - Name of the store/table
     * @param {Object} options - Query options (filter, sort, page, limit, offset)
     * @returns {Promise<Object>} Promise that resolves with query results
     */
    async query(storeName, options = {}) {
        return this.driver.query(storeName, options);
    }

    /**
     * Close the database connection
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
        }
    }

    /**
     * Factory method to create a Database instance with IndexedDB driver
     * @param {Object} configuration - IndexedDB configuration
     * @returns {Database} Database instance with IndexedDB driver
     */
    static createWithIndexedDB(configuration = {
        dbName: 'example',
        version: 1,
        schema: {}
    }) {
        const driver = IndexedDBDriver.create(configuration);
        return new Database(driver);
    }

    /**
     * Factory method to create a Database instance with a custom driver
     * @param {Driver} driver - Custom driver instance
     * @returns {Database} Database instance with the provided driver
     */
    static createWithDriver(driver) {
        return new Database(driver);
    }
}
