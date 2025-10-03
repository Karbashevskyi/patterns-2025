/**
 * Week 10: OPFS Storage Adapter
 * 
 * Implementation of IStorage using Origin Private File System (OPFS).
 * Stores each record as a separate JSON file.
 */

import { IStorage } from './storage-interface.js';

/**
 * OPFS Storage Implementation
 * Uses Origin Private File System for browser-side storage
 */
export class OPFSStorage extends IStorage {
  /**
   * @param {string} name - Storage name (used as directory name)
   */
  constructor(name) {
    super();
    this.name = name;
    this.directoryHandle = null;
    this.isInitialized = false;
  }

  /**
   * Initialize OPFS storage
   * @private
   */
  async _ensureInitialized() {
    if (this.isInitialized) return;

    try {
      // Get the root directory for OPFS
      const root = await navigator.storage.getDirectory();
      
      // Create/get a directory for this storage
      this.directoryHandle = await root.getDirectoryHandle(this.name, { create: true });
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize OPFS storage: ${error.message}`);
    }
  }

  /**
   * Get file handle for a record
   * @private
   */
  async _getFileHandle(id, create = false) {
    await this._ensureInitialized();
    const filename = `${id}.json`;
    
    try {
      return await this.directoryHandle.getFileHandle(filename, { create });
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Read file content as JSON
   * @private
   */
  async _readFile(fileHandle) {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  }

  /**
   * Write JSON to file
   * @private
   */
  async _writeFile(fileHandle, data) {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  /**
   * Get all file handles in directory
   * @private
   */
  async _getAllFileHandles() {
    await this._ensureInitialized();
    const handles = [];
    
    for await (const [name, handle] of this.directoryHandle.entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        handles.push(handle);
      }
    }
    
    return handles;
  }

  // IStorage interface implementation

  async create(record) {
    if (!record.id) {
      throw new Error('Record must have an id');
    }

    const fileHandle = await this._getFileHandle(record.id, false);
    if (fileHandle) {
      throw new Error(`Record with id '${record.id}' already exists`);
    }

    const newFileHandle = await this._getFileHandle(record.id, true);
    await this._writeFile(newFileHandle, record);
    
    return record.id;
  }

  async read(id) {
    const fileHandle = await this._getFileHandle(id, false);
    if (!fileHandle) {
      return null;
    }

    return await this._readFile(fileHandle);
  }

  async readAll() {
    const fileHandles = await this._getAllFileHandles();
    const records = [];

    for (const fileHandle of fileHandles) {
      const record = await this._readFile(fileHandle);
      records.push(record);
    }

    return records;
  }

  async update(id, updates) {
    const fileHandle = await this._getFileHandle(id, false);
    if (!fileHandle) {
      throw new Error(`Record with id '${id}' not found`);
    }

    const record = await this._readFile(fileHandle);
    const updatedRecord = { ...record, ...updates, id }; // Ensure id is not changed
    
    await this._writeFile(fileHandle, updatedRecord);
    
    return updatedRecord;
  }

  async delete(id) {
    await this._ensureInitialized();
    
    try {
      await this.directoryHandle.removeEntry(`${id}.json`);
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return false;
      }
      throw error;
    }
  }

  async deleteAll() {
    const fileHandles = await this._getAllFileHandles();
    let count = 0;

    for (const fileHandle of fileHandles) {
      try {
        await this.directoryHandle.removeEntry(fileHandle.name);
        count++;
      } catch (error) {
        console.error(`Failed to delete ${fileHandle.name}:`, error);
      }
    }

    return count;
  }

  async exists(id) {
    const fileHandle = await this._getFileHandle(id, false);
    return fileHandle !== null;
  }

  async count() {
    const fileHandles = await this._getAllFileHandles();
    return fileHandles.length;
  }

  getName() {
    return this.name;
  }

  getType() {
    return 'opfs';
  }

  async close() {
    // OPFS doesn't require explicit cleanup
    this.directoryHandle = null;
    this.isInitialized = false;
  }
}

/**
 * Factory function to create OPFS storage
 * @param {string} name - Storage name
 * @returns {Promise<OPFSStorage>} Initialized OPFS storage instance
 */
export async function createOPFSStorage(name) {
  const storage = new OPFSStorage(name);
  await storage._ensureInitialized();
  return storage;
}
