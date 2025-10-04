import {
  FileNotFoundError,
  ReadError,
  WriteError,
  DeleteError,
  NotSupportedError,
  escalateError,
  ErrorCollector,
} from '../errors.js';

export class OPFSStorage {
  #readStrategies = {
    text: async (file) => await file.text(),
    arrayBuffer: async (file) => await file.arrayBuffer(),
    blob: (file) => file,
  };

  constructor() {
    this.rootDir = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      if (!navigator.storage?.getDirectory) throw new TypeError('OPFS not supported');

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

  async #ensureInit() {
    if (!this.initialized) {
      await this.init();
    }
  }

  async writeFile(path, data) {
    await this.#ensureInit();

    try {
      const fileHandle = await this.rootDir.getFileHandle(path, { create: true });
      const writable = await fileHandle.createWritable();
      
      try {
        await writable.write(data);
        await writable.close();
      } catch (error) {
        try {
          await writable.close();
        } catch (closeError) {
          console.error('Error closing writable stream:', closeError);
        }
        throw error;
      }
    } catch (error) {
      const escalated = escalateError(error, {
        path,
        operation: 'write',
      });

      if (escalated instanceof WriteError) throw escalated;
      throw new WriteError(path, { cause: escalated });
    }
  }

  async readFile(path, type = 'text') {
    await this.#ensureInit();

    try {
      const fileHandle = await this.rootDir.getFileHandle(path);
      const file = await fileHandle.getFile();

      const strategy = this.#readStrategies[type];
      if (!strategy) throw new Error(`Unsupported type: ${type}`);

      return await strategy(file);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Unsupported type')) throw error;
      
      const escalated = escalateError(error, {
        path,
        operation: 'read',
      });
      

      if (escalated instanceof ReadError) throw escalated;
      throw new ReadError(path, { cause: escalated });

    }
  }

  async deleteFile(path) {
    await this.#ensureInit();

    try {
      await this.rootDir.removeEntry(path);
    } catch (error) {
      const escalated = escalateError(error, {
        path,
        operation: 'delete',
      });

      if (escalated instanceof DeleteError) throw escalated;
      throw new DeleteError(path, { cause: escalated });
    }
  }

  async exists(path) {
    await this.#ensureInit();

    try {
      await this.rootDir.getFileHandle(path);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') return false;
      throw escalateError(error, {
        path,
        operation: 'exists',
      });
    }
  }

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
      const escalated = escalateError(error, {
        path,
        operation: 'getMetadata',
      });

      if (escalated instanceof FileNotFoundError) throw escalated;
      throw new ReadError(path, { cause: escalated });
    }
  }

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

    if (collector.hasErrors()) {
      const summary = collector.summary;
      summary.results = results;
      return summary;
    }

    return { results, ...collector.summary };
  }

  async clear() {
    await this.#ensureInit();

    const files = await this.listFiles();
    if (files.length === 0) return { succeeded: 0, failed: 0 };

    return await this.deleteFiles(files);
  }

  async getStorageEstimate() {
    try {
      if (!navigator.storage?.estimate) throw new NotSupportedError('StorageManager.estimate');

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

export function createOPFSStorage() {
  return new OPFSStorage();
}
