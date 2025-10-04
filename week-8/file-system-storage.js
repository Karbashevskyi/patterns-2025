import {
  PermissionDeniedError,
  ReadError,
  WriteError,
  NotSupportedError,
  escalateError,
  ErrorCollector,
} from './errors.js';

export class FileSystemStorage {
  // Strategy Pattern: File reading strategies
  #readStrategies = {
    text: async (file) => await file.text(),
    arrayBuffer: async (file) => await file.arrayBuffer(),
    blob: (file) => file,
  };

  constructor() {
    this.fileHandle = null;
    this.directoryHandle = null;
  }

  static isSupported() {
    return 'showOpenFilePicker' in window;
  }

  #ensureSupport() {
    if (!FileSystemStorage.isSupported()) {
      throw new NotSupportedError('File System Access API');
    }
  }

  async pickFile(options = {}) {
    this.#ensureSupport();

    try {
      const [fileHandle] = await window.showOpenFilePicker(options);
      this.fileHandle = fileHandle;
      return fileHandle;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null;
      throw escalateError(error, {
        operation: 'pickFile',
        api: 'showOpenFilePicker',
      });
    }
  }

  async pickFiles(options = {}) {
    this.#ensureSupport();

    try {
      const fileHandles = await window.showOpenFilePicker({
        ...options,
        multiple: true,
      });
      return fileHandles;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return [];
      }
      throw escalateError(error, {
        operation: 'pickFiles',
        api: 'showOpenFilePicker',
      });
    }
  }

  async pickFileForSave(options = {}) {
    this.#ensureSupport();

    try {
      const fileHandle = await window.showSaveFilePicker(options);
      this.fileHandle = fileHandle;
      return fileHandle;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null;
      throw escalateError(error, {
        operation: 'pickFileForSave',
        api: 'showSaveFilePicker',
      });
    }
  }

  async pickDirectory(options = {}) {
    this.#ensureSupport();

    try {
      const directoryHandle = await window.showDirectoryPicker(options);
      this.directoryHandle = directoryHandle;
      return directoryHandle;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null;
      throw escalateError(error, {
        operation: 'pickDirectory',
        api: 'showDirectoryPicker',
      });
    }
  }

  async readFile(fileHandle, type = 'text') {
    try {
      const permission = await fileHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        const requested = await fileHandle.requestPermission({ mode: 'read' });
        if (requested !== 'granted') throw new PermissionDeniedError('read file');
      }

      const file = await fileHandle.getFile();

      const strategy = this.#readStrategies[type];
      if (!strategy) throw new Error(`Unsupported type: ${type}`);

      return await strategy(file);
    } catch (error) {
      if (error instanceof PermissionDeniedError) throw error;
      throw new ReadError(fileHandle.name, { cause: escalateError(error, {
        path: fileHandle.name,
        operation: 'read',
      }) });
    }
  }

  async writeFile(fileHandle, data) {
    try {
      const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        const requested = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (requested !== 'granted') throw new PermissionDeniedError('write file');
      }

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
      if (error instanceof PermissionDeniedError) throw error;
      throw new WriteError(fileHandle.name, { cause: escalateError(error, {
        path: fileHandle.name,
        operation: 'write',
      }) });
    }
  }

  async readFiles(fileHandles, type = 'text') {
    const collector = new ErrorCollector('readFiles');
    const results = {};

    for (const handle of fileHandles) {
      try {
        results[handle.name] = await this.readFile(handle, type);
        collector.addSuccess();
      } catch (error) {
        collector.addError(error, { path: handle.name, operation: 'read' });
      }
    }

    if (collector.hasErrors()) {
      const summary = collector.summary;
      summary.results = results;
      return summary;
    }

    return { results, ...collector.summary };
  }

  async writeFiles(files) {
    const collector = new ErrorCollector('writeFiles');

    for (const { handle, data } of files) {
      try {
        await this.writeFile(handle, data);
        collector.addSuccess();
      } catch (error) {
        collector.addError(error, { path: handle.name, operation: 'write' });
      }
    }

    collector.throwIfErrors();
    return collector.summary;
  }

  /**
   * List files in a directory
   * @param {FileSystemDirectoryHandle} directoryHandle - Directory handle
   */
  async listDirectory(directoryHandle) {
    try {
      const entries = [];

      for await (const [name, handle] of directoryHandle.entries()) {
        entries.push({
          name,
          kind: handle.kind,
          handle,
        });
      }

      return entries;
    } catch (error) {
      throw escalateError(error, {
        path: directoryHandle.name,
        operation: 'listDirectory',
      });
    }
  }

  async readDirectory(directoryHandle, type = 'text') {
    const entries = await this.listDirectory(directoryHandle);
    const fileHandles = entries
      .filter(entry => entry.kind === 'file')
      .map(entry => entry.handle);

    return await this.readFiles(fileHandles, type);
  }

  async readJSON(fileHandle) {
    const text = await this.readFile(fileHandle, 'text');
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ReadError(fileHandle.name, {
        cause: new Error('Invalid JSON format', { cause: error }),
      });
    }
  }

  async writeJSON(fileHandle, data) {
    const json = JSON.stringify(data, null, 2);
    await this.writeFile(fileHandle, json);
  }

  async verifyPermission(fileHandle, mode = 'read') {
    try {
      const permission = await fileHandle.queryPermission({ mode });
      if (permission === 'granted') return true;

      const requested = await fileHandle.requestPermission({ mode });
      return requested === 'granted';
    } catch (error) {
      throw escalateError(error, {
        path: fileHandle.name,
        operation: 'verifyPermission',
      });
    }
  }
}

export function createFileSystemStorage() {
  return new FileSystemStorage();
}
