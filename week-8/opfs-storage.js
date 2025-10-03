/**
 * Week 8: OPFS (Origin Private File System) Storage Abstraction
 * Demonstrates error aggregation and escalation
 */

import {
  FileNotFoundError,
  ReadError,
  WriteError,
  DeleteError,
  NotSupportedError,
  escalateError,
  ErrorCollector,
} from './errors.js';

/**
 * OPFS Storage - Abstraction over Origin Private File System
 * Provides a simple key-value store with file operations
 */
export class OPFSStorage {
  constructor() {
    this.rootDir = null;
    this.initialized = false;
  }

  /**
   * Initialize the OPFS storage
   */
  async init() {
    if (this.initialized) return;

    try {
      if (!navigator.storage?.getDirectory) {
        throw new TypeError('OPFS not supported');
      }

      this.rootDir = await navigator.storage.getDirectory();
      console.log('OPFS initialized', this.rootDir);
      this.initialized = true;
    } catch (error) {
      throw escalateError(error, {
        api: 'OPFS',
        operation: 'initialization',
      });
    }
  }

  /**
   * Ensure initialization before operations
   */
  async #ensureInit() {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Write data to a file
   * @param {string} path - File path
   * @param {string|ArrayBuffer|Blob} data - Data to write
   */
  async writeFile(path, data) {
    await this.#ensureInit();

    try {
      const fileHandle = await this.rootDir.getFileHandle(path, { create: true });
      const writable = await fileHandle.createWritable();
      
      try {
        await writable.write(data);
        await writable.close();
      } catch (error) {
        // Try to close on error
        try {
          await writable.close();
        } catch (closeError) {
          // Ignore close errors
        }
        throw error;
      }
    } catch (error) {
      throw escalateError(error, {
        path,
        operation: 'write',
      }) instanceof WriteError 
        ? escalateError(error, { path, operation: 'write' })
        : new WriteError(path, { cause: escalateError(error, { path, operation: 'write' }) });
    }
  }

  /**
   * Read data from a file
   * @param {string} path - File path
   * @param {string} type - Return type: 'text', 'arrayBuffer', 'blob'
   */
  async readFile(path, type = 'text') {
    await this.#ensureInit();

    try {
      const fileHandle = await this.rootDir.getFileHandle(path);
      const file = await fileHandle.getFile();

      switch (type) {
        case 'text':
          return await file.text();
        case 'arrayBuffer':
          return await file.arrayBuffer();
        case 'blob':
          return file;
        default:
          throw new Error(`Unsupported type: ${type}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Unsupported type')) {
        throw error;
      }
      throw escalateError(error, {
        path,
        operation: 'read',
      }) instanceof ReadError
        ? escalateError(error, { path, operation: 'read' })
        : new ReadError(path, { cause: escalateError(error, { path, operation: 'read' }) });
    }
  }

  /**
   * Delete a file
   * @param {string} path - File path
   */
  async deleteFile(path) {
    await this.#ensureInit();

    try {
      await this.rootDir.removeEntry(path);
    } catch (error) {
      throw escalateError(error, {
        path,
        operation: 'delete',
      }) instanceof DeleteError
        ? escalateError(error, { path, operation: 'delete' })
        : new DeleteError(path, { cause: escalateError(error, { path, operation: 'delete' }) });
    }
  }

  /**
   * Check if file exists
   * @param {string} path - File path
   */
  async exists(path) {
    await this.#ensureInit();

    try {
      await this.rootDir.getFileHandle(path);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return false;
      }
      throw escalateError(error, {
        path,
        operation: 'exists',
      });
    }
  }

  /**
   * List all files in the root directory
   */
  async listFiles() {
    await this.#ensureInit();

    try {
      const files = [];
      for await (const [name, handle] of this.rootDir.entries()) {
        if (handle.kind === 'file') {
          files.push(name);
        }
      }
      return files;
    } catch (error) {
      throw escalateError(error, {
        operation: 'listFiles',
      });
    }
  }

  /**
   * Get file metadata
   * @param {string} path - File path
   */
  async getMetadata(path) {
    await this.#ensureInit();

    try {
      const fileHandle = await this.rootDir.getFileHandle(path);
      const file = await fileHandle.getFile();
      
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
      };
    } catch (error) {
      throw escalateError(error, {
        path,
        operation: 'getMetadata',
      }) instanceof FileNotFoundError
        ? escalateError(error, { path, operation: 'getMetadata' })
        : new ReadError(path, { cause: escalateError(error, { path, operation: 'getMetadata' }) });
    }
  }

  /**
   * Write multiple files - demonstrates error aggregation
   * @param {Array<{path: string, data: any}>} files - Array of files to write
   */
  async writeFiles(files) {
    await this.#ensureInit();

    const collector = new ErrorCollector('writeFiles');

    for (const { path, data } of files) {
      try {
        await this.writeFile(path, data);
        collector.addSuccess();
      } catch (error) {
        collector.addError(error, { path, operation: 'write' });
      }
    }

    collector.throwIfErrors();
    return collector.summary;
  }

  /**
   * Delete multiple files - demonstrates error aggregation
   * @param {Array<string>} paths - Array of file paths to delete
   */
  async deleteFiles(paths) {
    await this.#ensureInit();

    const collector = new ErrorCollector('deleteFiles');

    for (const path of paths) {
      try {
        await this.deleteFile(path);
        collector.addSuccess();
      } catch (error) {
        collector.addError(error, { path, operation: 'delete' });
      }
    }

    collector.throwIfErrors();
    return collector.summary;
  }

  /**
   * Read multiple files - demonstrates error aggregation
   * @param {Array<string>} paths - Array of file paths to read
   * @param {string} type - Return type
   */
  async readFiles(paths, type = 'text') {
    await this.#ensureInit();

    const collector = new ErrorCollector('readFiles');
    const results = {};

    for (const path of paths) {
      try {
        results[path] = await this.readFile(path, type);
        collector.addSuccess();
      } catch (error) {
        collector.addError(error, { path, operation: 'read' });
      }
    }

    // For read operations, we might want to return partial results
    // instead of throwing immediately
    if (collector.hasErrors()) {
      const summary = collector.summary;
      summary.results = results;
      return summary;
    }

    return { results, ...collector.summary };
  }

  /**
   * Clear all files in storage
   */
  async clear() {
    await this.#ensureInit();

    const files = await this.listFiles();
    if (files.length === 0) return { succeeded: 0, failed: 0 };

    return await this.deleteFiles(files);
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate() {
    try {
      if (!navigator.storage?.estimate) {
        throw new NotSupportedError('StorageManager.estimate');
      }

      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      };
    } catch (error) {
      throw escalateError(error, {
        api: 'StorageManager.estimate',
        operation: 'getStorageEstimate',
      });
    }
  }

  /**
   * JSON-specific helpers
   */
  async writeJSON(path, data) {
    const json = JSON.stringify(data, null, 2);
    await this.writeFile(path, json);
  }

  async readJSON(path) {
    const text = await this.readFile(path, 'text');
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ReadError(path, {
        cause: new Error('Invalid JSON format', { cause: error }),
      });
    }
  }
}

/**
 * Create a singleton instance
 */
export function createOPFSStorage() {
  return new OPFSStorage();
}
