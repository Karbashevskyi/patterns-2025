import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { FileSystemStorage } from './file-system-storage.js';
import {
  FileNotFoundError,
  ReadError,
  WriteError,
  DeleteError,
  PermissionDeniedError,
} from '../errors.js';

// Mock helpers
function createMockFileHandle(name, content = 'mock content') {
  const mockFile = {
    name,
    size: content.length,
    type: 'text/plain',
    lastModified: Date.now(),
    text: () => Promise.resolve(content),
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(content).buffer),
    slice: () => new Blob([content]),
  };

  return {
    name,
    kind: 'file',
    getFile: mock.fn(() => Promise.resolve(mockFile)),
    queryPermission: mock.fn(() => Promise.resolve('granted')),
    requestPermission: mock.fn(() => Promise.resolve('granted')),
    createWritable: mock.fn(() => Promise.resolve({
      write: mock.fn(() => Promise.resolve()),
      close: mock.fn(() => Promise.resolve()),
    })),
  };
}

function createMockDirectoryHandle(name, files = []) {
  const entries = new Map(files.map(f => [f.name, f]));
  
  return {
    name,
    kind: 'directory',
    queryPermission: mock.fn(() => Promise.resolve('granted')),
    requestPermission: mock.fn(() => Promise.resolve('granted')),
    getFileHandle: mock.fn((fileName) => {
      const file = files.find(f => f.name === fileName);
      if (!file) return Promise.reject(new Error('File not found'));
      return Promise.resolve(file);
    }),
    values: () => entries.values(),
    [Symbol.asyncIterator]: async function* () {
      for (const entry of entries.values()) {
        yield entry;
      }
    },
  };
}

function createMockFileHandleWithError(name, errorType = 'NotFoundError') {
  return {
    name,
    kind: 'file',
    getFile: mock.fn(() => Promise.reject(new Error(errorType))),
    queryPermission: mock.fn(() => Promise.resolve('granted')),
  };
}

describe('FileSystemStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new FileSystemStorage();
    
    // Mock showOpenFilePicker globally
    global.showOpenFilePicker = mock.fn();
    global.showSaveFilePicker = mock.fn();
    global.showDirectoryPicker = mock.fn();
  });

  describe('Browser Support Detection', () => {
    it('should detect support when API available', () => {
      global.showOpenFilePicker = () => {};
      assert.strictEqual(FileSystemStorage.isSupported(), true);
    });

    it('should detect no support when API unavailable', () => {
      delete global.showOpenFilePicker;
      assert.strictEqual(FileSystemStorage.isSupported(), false);
      
      // Restore for other tests
      global.showOpenFilePicker = mock.fn();
    });
  });

  describe('File Picker - Single File', () => {
    it('should pick single file', async () => {
      const mockHandle = createMockFileHandle('test.txt', 'content');
      global.showOpenFilePicker.mock.mockImplementation(() => 
        Promise.resolve([mockHandle])
      );

      const result = await storage.pickFile();

      assert.strictEqual(result.handle.name, 'test.txt');
      assert.ok(result.file);
      assert.strictEqual(await result.file.text(), 'content');
    });

    it('should handle user cancellation', async () => {
      global.showOpenFilePicker.mock.mockImplementation(() =>
        Promise.reject(new DOMException('User cancelled', 'AbortError'))
      );

      const result = await storage.pickFile();
      assert.strictEqual(result, null);
    });

    it('should pass file type filters', async () => {
      const mockHandle = createMockFileHandle('document.txt');
      global.showOpenFilePicker.mock.mockImplementation(() =>
        Promise.resolve([mockHandle])
      );

      const types = [{
        description: 'Text files',
        accept: { 'text/plain': ['.txt'] },
      }];

      await storage.pickFile({ types });

      const calls = global.showOpenFilePicker.mock.calls;
      assert.strictEqual(calls.length, 1);
      assert.deepStrictEqual(calls[0].arguments[0].types, types);
    });
  });

  describe('File Picker - Multiple Files', () => {
    it('should pick multiple files', async () => {
      const mockHandles = [
        createMockFileHandle('file1.txt', 'content1'),
        createMockFileHandle('file2.txt', 'content2'),
      ];
      
      global.showOpenFilePicker.mock.mockImplementation(() =>
        Promise.resolve(mockHandles)
      );

      const results = await storage.pickFiles();

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].handle.name, 'file1.txt');
      assert.strictEqual(results[1].handle.name, 'file2.txt');
    });

    it('should return empty array on cancellation', async () => {
      global.showOpenFilePicker.mock.mockImplementation(() =>
        Promise.reject(new DOMException('User cancelled', 'AbortError'))
      );

      const results = await storage.pickFiles();
      assert.deepStrictEqual(results, []);
    });
  });

  describe('File Picker - Save', () => {
    it('should pick file for save', async () => {
      const mockHandle = createMockFileHandle('output.txt');
      global.showSaveFilePicker.mock.mockImplementation(() =>
        Promise.resolve(mockHandle)
      );

      const result = await storage.pickFileForSave();

      assert.strictEqual(result.name, 'output.txt');
      assert.ok(result.createWritable);
    });

    it('should pass suggested name', async () => {
      const mockHandle = createMockFileHandle('suggested.txt');
      global.showSaveFilePicker.mock.mockImplementation(() =>
        Promise.resolve(mockHandle)
      );

      await storage.pickFileForSave({ suggestedName: 'suggested.txt' });

      const calls = global.showSaveFilePicker.mock.calls;
      assert.strictEqual(calls[0].arguments[0].suggestedName, 'suggested.txt');
    });
  });

  describe('Directory Picker', () => {
    it('should pick directory', async () => {
      const mockFiles = [
        createMockFileHandle('file1.txt'),
        createMockFileHandle('file2.txt'),
      ];
      const mockDirHandle = createMockDirectoryHandle('mydir', mockFiles);
      
      global.showDirectoryPicker.mock.mockImplementation(() =>
        Promise.resolve(mockDirHandle)
      );

      const result = await storage.pickDirectory();

      assert.strictEqual(result.name, 'mydir');
      assert.strictEqual(result.kind, 'directory');
    });

    it('should return null on cancellation', async () => {
      global.showDirectoryPicker.mock.mockImplementation(() =>
        Promise.reject(new DOMException('User cancelled', 'AbortError'))
      );

      const result = await storage.pickDirectory();
      assert.strictEqual(result, null);
    });
  });

  describe('Strategy Pattern - Read Types', () => {
    let mockHandle;

    beforeEach(() => {
      mockHandle = createMockFileHandle('strategy.txt', 'Strategy Pattern Test');
    });

    it('should use text strategy', async () => {
      const result = await storage.readFile(mockHandle, 'text');
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result, 'Strategy Pattern Test');
    });

    it('should use arrayBuffer strategy', async () => {
      const result = await storage.readFile(mockHandle, 'arrayBuffer');
      assert.ok(result instanceof ArrayBuffer);
    });

    it('should use blob strategy', async () => {
      const result = await storage.readFile(mockHandle, 'blob');
      assert.ok(result);
      assert.strictEqual(typeof result.slice, 'function');
    });

    it('should throw error for unsupported type', async () => {
      await assert.rejects(
        async () => await storage.readFile(mockHandle, 'unsupported'),
        { message: 'Unsupported type: unsupported' }
      );
    });

    it('should default to text type', async () => {
      const result = await storage.readFile(mockHandle);
      assert.strictEqual(typeof result, 'string');
    });
  });

  describe('File Writing', () => {
    it('should write text to file', async () => {
      const mockHandle = createMockFileHandle('output.txt');
      const content = 'Hello, File System!';

      await storage.writeFile(mockHandle, content);

      assert.strictEqual(mockHandle.createWritable.mock.calls.length, 1);
    });

    it('should write ArrayBuffer to file', async () => {
      const mockHandle = createMockFileHandle('binary.bin');
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      await storage.writeFile(mockHandle, data.buffer);

      assert.strictEqual(mockHandle.createWritable.mock.calls.length, 1);
    });

    it('should throw WriteError on failure', async () => {
      const mockHandle = {
        name: 'error.txt',
        createWritable: mock.fn(() => Promise.reject(new Error('Write failed'))),
      };

      await assert.rejects(
        async () => await storage.writeFile(mockHandle, 'content'),
        WriteError
      );
    });
  });

  describe('File Deletion', () => {
    it('should delete file from directory', async () => {
      const mockFileHandle = createMockFileHandle('delete-me.txt');
      const mockDirHandle = {
        removeEntry: mock.fn(() => Promise.resolve()),
      };

      await storage.deleteFile(mockDirHandle, 'delete-me.txt');

      assert.strictEqual(mockDirHandle.removeEntry.mock.calls.length, 1);
      assert.strictEqual(mockDirHandle.removeEntry.mock.calls[0].arguments[0], 'delete-me.txt');
    });

    it('should throw DeleteError on failure', async () => {
      const mockDirHandle = {
        removeEntry: mock.fn(() => Promise.reject(new Error('Delete failed'))),
      };

      await assert.rejects(
        async () => await storage.deleteFile(mockDirHandle, 'file.txt'),
        DeleteError
      );
    });
  });

  describe('Permission Handling', () => {
    it('should query permission', async () => {
      const mockHandle = createMockFileHandle('perm-test.txt');
      mockHandle.queryPermission.mock.mockImplementation(() =>
        Promise.resolve('granted')
      );

      const result = await storage.queryPermission(mockHandle, 'read');

      assert.strictEqual(result, 'granted');
      assert.strictEqual(mockHandle.queryPermission.mock.calls.length, 1);
    });

    it('should request permission', async () => {
      const mockHandle = createMockFileHandle('perm-test.txt');
      mockHandle.requestPermission.mock.mockImplementation(() =>
        Promise.resolve('granted')
      );

      const result = await storage.requestPermission(mockHandle, 'readwrite');

      assert.strictEqual(result, 'granted');
      assert.strictEqual(mockHandle.requestPermission.mock.calls.length, 1);
    });

    it('should verify permission and request if needed', async () => {
      const mockHandle = createMockFileHandle('verify-test.txt');
      mockHandle.queryPermission.mock.mockImplementation(() =>
        Promise.resolve('prompt')
      );
      mockHandle.requestPermission.mock.mockImplementation(() =>
        Promise.resolve('granted')
      );

      const result = await storage.verifyPermission(mockHandle, 'readwrite');

      assert.strictEqual(result, true);
      assert.strictEqual(mockHandle.queryPermission.mock.calls.length, 1);
      assert.strictEqual(mockHandle.requestPermission.mock.calls.length, 1);
    });

    it('should return false when permission denied', async () => {
      const mockHandle = createMockFileHandle('denied-test.txt');
      mockHandle.queryPermission.mock.mockImplementation(() =>
        Promise.resolve('denied')
      );

      const result = await storage.verifyPermission(mockHandle, 'read');

      assert.strictEqual(result, false);
    });

    it('should throw PermissionDeniedError when permission denied after request', async () => {
      const mockHandle = createMockFileHandle('denied-req.txt');
      mockHandle.queryPermission.mock.mockImplementation(() =>
        Promise.resolve('prompt')
      );
      mockHandle.requestPermission.mock.mockImplementation(() =>
        Promise.resolve('denied')
      );

      await assert.rejects(
        async () => await storage.verifyPermission(mockHandle, 'readwrite', true),
        PermissionDeniedError
      );
    });
  });

  describe('Batch Operations - Read', () => {
    it('should read multiple files', async () => {
      const mockHandles = [
        createMockFileHandle('batch1.txt', 'content1'),
        createMockFileHandle('batch2.txt', 'content2'),
        createMockFileHandle('batch3.txt', 'content3'),
      ];

      const result = await storage.readFiles(mockHandles);

      assert.strictEqual(result.succeeded, 3);
      assert.strictEqual(result.failed, 0);
      assert.strictEqual(result.results['batch1.txt'], 'content1');
      assert.strictEqual(result.results['batch2.txt'], 'content2');
      assert.strictEqual(result.results['batch3.txt'], 'content3');
    });

    it('should handle partial read failures', async () => {
      const mockHandles = [
        createMockFileHandle('good1.txt', 'content1'),
        createMockFileHandleWithError('bad.txt', 'ReadError'),
        createMockFileHandle('good2.txt', 'content2'),
      ];

      const result = await storage.readFiles(mockHandles);

      assert.strictEqual(result.succeeded, 2);
      assert.strictEqual(result.failed, 1);
      assert.ok(result.errors['bad.txt']);
    });
  });

  describe('Batch Operations - Write', () => {
    it('should write multiple files', async () => {
      const files = [
        { handle: createMockFileHandle('write1.txt'), data: 'content1' },
        { handle: createMockFileHandle('write2.txt'), data: 'content2' },
      ];

      const result = await storage.writeFiles(files);

      assert.strictEqual(result.succeeded, 2);
      assert.strictEqual(result.failed, 0);
    });
  });

  describe('Batch Operations - Delete', () => {
    it('should delete multiple files', async () => {
      const mockDirHandle = {
        removeEntry: mock.fn(() => Promise.resolve()),
      };
      const fileNames = ['del1.txt', 'del2.txt', 'del3.txt'];

      const result = await storage.deleteFiles(mockDirHandle, fileNames);

      assert.strictEqual(result.succeeded, 3);
      assert.strictEqual(result.failed, 0);
      assert.strictEqual(mockDirHandle.removeEntry.mock.calls.length, 3);
    });
  });

  describe('Directory Operations', () => {
    it('should list directory contents', async () => {
      const mockFiles = [
        createMockFileHandle('file1.txt'),
        createMockFileHandle('file2.txt'),
      ];
      const mockDirHandle = createMockDirectoryHandle('testdir', mockFiles);

      const entries = await storage.listDirectory(mockDirHandle);

      assert.strictEqual(entries.length, 2);
      assert.strictEqual(entries[0].name, 'file1.txt');
      assert.strictEqual(entries[1].name, 'file2.txt');
    });

    it('should read all files in directory', async () => {
      const mockFiles = [
        createMockFileHandle('dir1.txt', 'content1'),
        createMockFileHandle('dir2.txt', 'content2'),
      ];
      const mockDirHandle = createMockDirectoryHandle('readdir', mockFiles);

      const result = await storage.readDirectory(mockDirHandle);

      assert.strictEqual(result.succeeded, 2);
      assert.strictEqual(result.results['dir1.txt'], 'content1');
      assert.strictEqual(result.results['dir2.txt'], 'content2');
    });
  });

  describe('JSON Operations', () => {
    it('should write and read JSON', async () => {
      const data = { name: 'Test', value: 42 };
      const mockHandle = createMockFileHandle('data.json', JSON.stringify(data));

      // Mock for write
      const writeHandle = createMockFileHandle('output.json');
      await storage.writeJSON(writeHandle, data);

      // Mock for read - need to update the mock's content
      mockHandle.getFile.mock.mockImplementation(() =>
        Promise.resolve({
          text: () => Promise.resolve(JSON.stringify(data)),
        })
      );

      const result = await storage.readJSON(mockHandle);

      assert.deepStrictEqual(result, data);
    });

    it('should throw ReadError for invalid JSON', async () => {
      const mockHandle = createMockFileHandle('invalid.json', 'not json');

      await assert.rejects(
        async () => await storage.readJSON(mockHandle),
        ReadError
      );
    });
  });
});
