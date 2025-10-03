/**
 * Week 8: File System Access API Wrapper
 * Handles user-visible file system with error escalation
 */

import {
  PermissionDeniedError,
  ReadError,
  WriteError,
  NotSupportedError,
  escalateError,
  ErrorCollector,
} from './errors.js';

/**
 * File System Access API Storage
 * Wrapper for user-selected files and directories
 */
export class FileSystemStorage {
  constructor() {
    this.fileHandle = null;
    this.directoryHandle = null;
  }

  /**
   * Check if API is supported
   */
  static isSupported() {
    return 'showOpenFilePicker' in window;
  }

  /**
   * Ensure API support
   */
  #ensureSupport() {
    if (!FileSystemStorage.isSupported()) {
      throw new NotSupportedError('File System Access API');
    }
  }

  /**
   * Pick a file for reading
   * @param {Object} options - File picker options
   */
  async pickFile(options = {}) {
    this.#ensureSupport();

    try {
      const [fileHandle] = await window.showOpenFilePicker(options);
      this.fileHandle = fileHandle;
      return fileHandle;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled - this is not really an error
        return null;
      }
      throw escalateError(error, {
        operation: 'pickFile',
        api: 'showOpenFilePicker',
      });
    }
  }

  /**
   * Pick multiple files for reading
   * @param {Object} options - File picker options
   */
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

  /**
   * Pick a file for saving
   * @param {Object} options - File picker options
   */
  async pickFileForSave(options = {}) {
    this.#ensureSupport();

    try {
      const fileHandle = await window.showSaveFilePicker(options);
      this.fileHandle = fileHandle;
      return fileHandle;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw escalateError(error, {
        operation: 'pickFileForSave',
        api: 'showSaveFilePicker',
      });
    }
  }

  /**
   * Pick a directory
   * @param {Object} options - Directory picker options
   */
  async pickDirectory(options = {}) {
    this.#ensureSupport();

    try {
      const directoryHandle = await window.showDirectoryPicker(options);
      this.directoryHandle = directoryHandle;
      return directoryHandle;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw escalateError(error, {
        operation: 'pickDirectory',
        api: 'showDirectoryPicker',
      });
    }
  }

  /**
   * Read file content
   * @param {FileSystemFileHandle} fileHandle - File handle to read
   * @param {string} type - Return type: 'text', 'arrayBuffer', 'blob'
   */
  async readFile(fileHandle, type = 'text') {
    try {
      // Request permission if needed
      const permission = await fileHandle.queryPermission({ mode: 'read' });
      if (permission !== 'granted') {
        const requested = await fileHandle.requestPermission({ mode: 'read' });
        if (requested !== 'granted') {
          throw new PermissionDeniedError('read file');
        }
      }

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
      if (error instanceof PermissionDeniedError) {
        throw error;
      }
      throw new ReadError(fileHandle.name, { cause: escalateError(error, {
        path: fileHandle.name,
        operation: 'read',
      }) });
    }
  }

  /**
   * Write file content
   * @param {FileSystemFileHandle} fileHandle - File handle to write
   * @param {string|ArrayBuffer|Blob} data - Data to write
   */
  async writeFile(fileHandle, data) {
    try {
      // Request write permission
      const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        const requested = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (requested !== 'granted') {
          throw new PermissionDeniedError('write file');
        }
      }

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
      if (error instanceof PermissionDeniedError) {
        throw error;
      }
      throw new WriteError(fileHandle.name, { cause: escalateError(error, {
        path: fileHandle.name,
        operation: 'write',
      }) });
    }
  }

  /**
   * Read multiple files - demonstrates error aggregation
   * @param {Array<FileSystemFileHandle>} fileHandles - Array of file handles
   * @param {string} type - Return type
   */
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

    // Return partial results for read operations
    if (collector.hasErrors()) {
      const summary = collector.summary;
      summary.results = results;
      return summary;
    }

    return { results, ...collector.summary };
  }

  /**
   * Write multiple files - demonstrates error aggregation
   * @param {Array<{handle: FileSystemFileHandle, data: any}>} files
   */
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

  /**
   * Read all files from a directory
   * @param {FileSystemDirectoryHandle} directoryHandle - Directory handle
   * @param {string} type - Return type
   */
  async readDirectory(directoryHandle, type = 'text') {
    const entries = await this.listDirectory(directoryHandle);
    const fileHandles = entries
      .filter(entry => entry.kind === 'file')
      .map(entry => entry.handle);

    return await this.readFiles(fileHandles, type);
  }

  /**
   * JSON-specific helpers
   */
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

  /**
   * Verify permission for a file handle
   * @param {FileSystemFileHandle} fileHandle - File handle
   * @param {string} mode - Permission mode: 'read' or 'readwrite'
   */
  async verifyPermission(fileHandle, mode = 'read') {
    try {
      const permission = await fileHandle.queryPermission({ mode });
      if (permission === 'granted') {
        return true;
      }

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

/**
 * Create a new instance
 */
export function createFileSystemStorage() {
  return new FileSystemStorage();
}
