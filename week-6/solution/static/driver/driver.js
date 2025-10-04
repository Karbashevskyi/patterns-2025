/**
 * Base Driver class that defines the interface for all database drivers
 * This is an abstract class that should be extended by concrete drivers
 */
export class Driver {
    
    constructor() {
        if (this.constructor === Driver) {
            throw new Error('Driver is an abstract class and cannot be instantiated directly');
        }
    }

    /**
     * Add a record to the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} data - Data to add
     * @returns {Promise<any>} Promise that resolves with the result
     */
    async add(storeName, data) {
        throw new Error('add() method must be implemented by subclass');
    }

    /**
     * Get a record by key from the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} key - Key to search for
     * @returns {Promise<any>} Promise that resolves with the record
     */
    async get(storeName, key) {
        throw new Error('get() method must be implemented by subclass');
    }

    /**
     * Get all records from the specified store/table
     * @param {string} storeName - Name of the store/table
     * @returns {Promise<Array>} Promise that resolves with array of records
     */
    async getAll(storeName) {
        throw new Error('getAll() method must be implemented by subclass');
    }

    /**
     * Update a record in the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} data - Data to update
     * @returns {Promise<any>} Promise that resolves with the result
     */
    async update(storeName, data) {
        throw new Error('update() method must be implemented by subclass');
    }

    /**
     * Delete a record by key from the specified store/table
     * @param {string} storeName - Name of the store/table
     * @param {any} key - Key of the record to delete
     * @returns {Promise<any>} Promise that resolves with the result
     */
    async delete(storeName, key) {
        throw new Error('delete() method must be implemented by subclass');
    }

    /**
     * Query records with filtering and sorting
     * @param {string} storeName - Name of the store/table
     * @param {Object} options - Query options (filter, sort)
     * @returns {Promise<Array>} Promise that resolves with filtered and sorted data
     */
    async query(storeName, options = {}) {
        throw new Error('query() method must be implemented by subclass');
    }

    /**
     * Close the database connection
     */
    async close() {
        throw new Error('close() method must be implemented by subclass');
    }
}