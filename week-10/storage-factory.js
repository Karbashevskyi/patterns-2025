/**
 * Week 10: Storage Factory
 * 
 * Factory for creating storage instances.
 * Abstracts the creation of storage adapters.
 */

import { StorageCapabilities } from './storage-interface.js';
import { createOPFSStorage } from './opfs-storage.js';
import { createIndexedDBStorage } from './indexeddb-storage.js';

/**
 * Storage type enum
 */
export const StorageType = {
  OPFS: 'opfs',
  INDEXEDDB: 'indexeddb',
  AUTO: 'auto' // Automatically choose best available
};

/**
 * Storage Factory
 * Creates appropriate storage implementation based on type
 */
export class StorageFactory {
  /**
   * Create a storage instance
   * @param {string} type - Storage type ('opfs', 'indexeddb', or 'auto')
   * @param {string} name - Storage name
   * @param {Object} options - Additional options
   * @returns {Promise<IStorage>} Storage instance
   * @throws {Error} If storage type not supported
   */
  static async create(type, name, options = {}) {
    let actualType = type;

    // Auto-detect best storage type
    if (type === StorageType.AUTO) {
      actualType = StorageCapabilities.getRecommended();
      if (!actualType) {
        throw new Error('No storage implementation available in this environment');
      }
      console.log(`Auto-selected storage type: ${actualType}`);
    }

    // Validate storage type is available
    if (!StorageCapabilities.getAvailableTypes().includes(actualType)) {
      throw new Error(
        `Storage type '${actualType}' not available. Available types: ${StorageCapabilities.getAvailableTypes().join(', ')}`
      );
    }

    // Create appropriate storage instance
    switch (actualType) {
      case StorageType.INDEXEDDB:
        return await createIndexedDBStorage(name, options.version);

      case StorageType.OPFS:
        return await createOPFSStorage(name);

      default:
        throw new Error(`Unknown storage type: ${actualType}`);
    }
  }

  /**
   * Get available storage types in current environment
   * @returns {string[]} Array of available storage types
   */
  static getAvailableTypes() {
    return StorageCapabilities.getAvailableTypes();
  }

  /**
   * Check if a specific storage type is available
   * @param {string} type - Storage type to check
   * @returns {boolean} True if available
   */
  static isAvailable(type) {
    return StorageCapabilities.getAvailableTypes().includes(type);
  }

  /**
   * Get recommended storage type for current environment
   * @returns {string|null} Recommended storage type or null if none available
   */
  static getRecommended() {
    return StorageCapabilities.getRecommended();
  }
}

/**
 * Convenience function to create storage with auto-detection
 * @param {string} name - Storage name
 * @param {string} preferredType - Preferred storage type (optional)
 * @returns {Promise<IStorage>} Storage instance
 */
export async function createStorage(name, preferredType = StorageType.AUTO) {
  return await StorageFactory.create(preferredType, name);
}

/**
 * Migration helper to copy data between storage implementations
 */
export class StorageMigration {
  /**
   * Migrate all data from source to target storage
   * @param {IStorage} source - Source storage
   * @param {IStorage} target - Target storage
   * @param {Object} options - Migration options
   * @returns {Promise<{success: number, failed: number}>} Migration results
   */
  static async migrate(source, target, options = {}) {
    const { deleteSource = false, onProgress } = options;

    const records = await source.readAll();
    let success = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Check if record already exists in target
        const exists = await target.exists(record.id);
        
        if (exists) {
          // Update existing record
          await target.update(record.id, record);
        } else {
          // Create new record
          await target.create(record);
        }
        
        success++;
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: records.length,
            record,
            success,
            failed
          });
        }
      } catch (error) {
        failed++;
        console.error(`Failed to migrate record ${record.id}:`, error);
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: records.length,
            record,
            success,
            failed,
            error
          });
        }
      }
    }

    // Optionally delete source data after successful migration
    if (deleteSource && failed === 0) {
      await source.deleteAll();
    }

    return { success, failed };
  }

  /**
   * Compare two storage implementations for consistency
   * @param {IStorage} storage1 - First storage
   * @param {IStorage} storage2 - Second storage
   * @returns {Promise<{equal: boolean, differences: Array}>} Comparison results
   */
  static async compare(storage1, storage2) {
    const records1 = await storage1.readAll();
    const records2 = await storage2.readAll();

    const differences = [];

    // Check records only in storage1
    for (const record of records1) {
      const record2 = await storage2.read(record.id);
      if (!record2) {
        differences.push({
          type: 'missing_in_storage2',
          id: record.id,
          record
        });
      } else if (JSON.stringify(record) !== JSON.stringify(record2)) {
        differences.push({
          type: 'different',
          id: record.id,
          record1: record,
          record2
        });
      }
    }

    // Check records only in storage2
    for (const record of records2) {
      const record1 = await storage1.read(record.id);
      if (!record1) {
        differences.push({
          type: 'missing_in_storage1',
          id: record.id,
          record
        });
      }
    }

    return {
      equal: differences.length === 0,
      differences
    };
  }
}
