import { StorageCapabilities } from './storage-interface.js';
import { createOPFSStorage } from './opfs-storage.js';
import { createIndexedDBStorage } from './indexeddb-storage.js';

export const StorageType = {
  OPFS: 'opfs',
  INDEXEDDB: 'indexeddb',
  AUTO: 'auto'
};

export class StorageFactory {

  static async create(type, name, options = {}) {
    let actualType = type;

    if (type === StorageType.AUTO) {
      actualType = StorageCapabilities.getRecommended();
      if (!actualType) throw new Error('No storage implementation available in this environment');
      console.log(`Auto-selected storage type: ${actualType}`);
    }

    if (!StorageCapabilities.getAvailableTypes().includes(actualType)) {
      throw new Error(
        `Storage type '${actualType}' not available. Available types: ${StorageCapabilities.getAvailableTypes().join(', ')}`
      );
    }

    switch (actualType) {
      case StorageType.INDEXEDDB:
        return await createIndexedDBStorage(name, options.version);

      case StorageType.OPFS:
        return await createOPFSStorage(name);

      default:
        throw new Error(`Unknown storage type: ${actualType}`);
    }
  }

  static getAvailableTypes() {
    return StorageCapabilities.getAvailableTypes();
  }

  static isAvailable(type) {
    return StorageCapabilities.getAvailableTypes().includes(type);
  }

  static getRecommended() {
    return StorageCapabilities.getRecommended();
  }
}

export async function createStorage(name, preferredType = StorageType.AUTO) {
  return await StorageFactory.create(preferredType, name);
}

export class StorageMigration {

  static async migrate(source, target, options = {}) {
    const { deleteSource = false, onProgress } = options;

    const records = await source.readAll();
    let success = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        const exists = await target.exists(record.id);
        
        if (exists) await target.update(record.id, record);
        else await target.create(record);
        
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

    if (deleteSource && failed === 0) {
      await source.deleteAll();
    }

    return { success, failed };
  }

  static async compare(storage1, storage2) {
    const records1 = await storage1.readAll();
    const records2 = await storage2.readAll();

    const differences = [];

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
