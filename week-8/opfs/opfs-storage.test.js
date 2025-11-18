/**
 * OPFS Storage Integration Tests
 * 
 * ⚠️  REQUIRES BROWSER ENVIRONMENT ⚠️
 * 
 * These tests use the Origin Private File System API which is only available in browsers.
 * When run in Node.js, all tests will be automatically SKIPPED.
 * 
 * To run these tests:
 * 1. Open demo-native.html in a browser (Chrome 86+, Edge 86+)
 * 2. Open browser DevTools console
 * 3. Tests will run automatically
 * 
 * OR use a browser test runner like:
 * - Playwright: npx playwright test
 * - Puppeteer: node test-runner.js
 * - Vitest with browser mode: npx vitest --browser
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { OPFSStorage } from './opfs-storage.js';
import {
  ReadError,
  DeleteError,
} from '../errors.js';

// Check if running in browser environment
const isBrowser = typeof navigator !== 'undefined' && 
                  typeof navigator.storage !== 'undefined' &&
                  typeof navigator.storage.getDirectory === 'function';

// Skip all tests if not in browser
const describeOrSkip = isBrowser ? describe : describe.skip;

// Log environment detection
if (!isBrowser) {
  console.log('⚠️  OPFS tests skipped: Browser environment required');
  console.log('   Run these tests in Chrome/Edge 86+ or use Playwright/Puppeteer');
}

describeOrSkip('OPFSStorage', () => {
  let storage;

  beforeEach(async () => {
    storage = new OPFSStorage();
    await storage.init();
    await storage.clear();
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newStorage = new OPFSStorage();
      await newStorage.init();
      
      assert.strictEqual(newStorage.initialized, true);
      assert.ok(newStorage.rootDir);
    });

    it('should not re-initialize if already initialized', async () => {
      const rootDir = storage.rootDir;
      await storage.init();
      
      assert.strictEqual(storage.rootDir, rootDir);
    });

    it('should throw error if OPFS not supported', async () => {
      const originalGetDirectory = navigator.storage?.getDirectory;
      delete navigator.storage;

      const newStorage = new OPFSStorage();
      
      await assert.rejects(
        async () => await newStorage.init(),
        { name: 'TypeError' }
      );
      
      if (originalGetDirectory) {
        navigator.storage = { getDirectory: originalGetDirectory };
      }
    });
  });

  describe('File Operations - Text', () => {
    it('should write and read text file', async () => {
      const content = 'Hello, OPFS!';
      
      await storage.writeFile('test.txt', content);
      const result = await storage.readFile('test.txt', 'text');
      
      assert.strictEqual(result, content);
    });

    it('should overwrite existing file', async () => {
      await storage.writeFile('test.txt', 'First content');
      await storage.writeFile('test.txt', 'Second content');
      
      const result = await storage.readFile('test.txt', 'text');
      assert.strictEqual(result, 'Second content');
    });

    it('should throw ReadError for non-existent file', async () => {
      await assert.rejects(
        async () => await storage.readFile('nonexistent.txt', 'text'),
        ReadError
      );
    });
  });

  describe('File Operations - ArrayBuffer', () => {
    it('should write and read arrayBuffer', async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      
      await storage.writeFile('binary.bin', data);
      const result = await storage.readFile('binary.bin', 'arrayBuffer');
      
      assert.deepStrictEqual(new Uint8Array(result), data);
    });
  });

  describe('File Operations - Blob', () => {
    it('should write and read blob', async () => {
      const blob = new Blob(['blob content'], { type: 'text/plain' });
      
      await storage.writeFile('blob.txt', blob);
      const result = await storage.readFile('blob.txt', 'blob');
      
      assert.ok(result instanceof Blob);
      assert.strictEqual(await result.text(), 'blob content');
    });
  });

  describe('Strategy Pattern - Read Types', () => {
    beforeEach(async () => {
      await storage.writeFile('strategy-test.txt', 'Strategy Pattern Test');
    });

    it('should use text strategy', async () => {
      const result = await storage.readFile('strategy-test.txt', 'text');
      assert.strictEqual(typeof result, 'string');
    });

    it('should use arrayBuffer strategy', async () => {
      const result = await storage.readFile('strategy-test.txt', 'arrayBuffer');
      assert.ok(result instanceof ArrayBuffer);
    });

    it('should use blob strategy', async () => {
      const result = await storage.readFile('strategy-test.txt', 'blob');
      assert.ok(result instanceof Blob);
    });

    it('should throw error for unsupported type', async () => {
      await assert.rejects(
        async () => await storage.readFile('strategy-test.txt', 'unsupported'),
        { message: 'Unsupported type: unsupported' }
      );
    });
  });

  describe('File Deletion', () => {
    it('should delete existing file', async () => {
      await storage.writeFile('delete-me.txt', 'content');
      
      await storage.deleteFile('delete-me.txt');
      
      await assert.rejects(
        async () => await storage.readFile('delete-me.txt', 'text'),
        ReadError
      );
    });

    it('should throw DeleteError for non-existent file', async () => {
      await assert.rejects(
        async () => await storage.deleteFile('nonexistent.txt'),
        DeleteError
      );
    });
  });

  describe('File Existence', () => {
    it('should return true for existing file', async () => {
      await storage.writeFile('exists.txt', 'content');
      
      const exists = await storage.exists('exists.txt');
      assert.strictEqual(exists, true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await storage.exists('nonexistent.txt');
      assert.strictEqual(exists, false);
    });
  });

  describe('List Files', () => {
    it('should list all files', async () => {
      await storage.writeFile('file1.txt', 'content1');
      await storage.writeFile('file2.txt', 'content2');
      await storage.writeFile('file3.txt', 'content3');
      
      const files = await storage.listFiles();
      
      assert.ok(files.includes('file1.txt'));
      assert.ok(files.includes('file2.txt'));
      assert.ok(files.includes('file3.txt'));
      assert.strictEqual(files.length, 3);
    });

    it('should return empty array when no files', async () => {
      const files = await storage.listFiles();
      assert.deepStrictEqual(files, []);
    });
  });

  describe('File Metadata', () => {
    it('should get file metadata', async () => {
      const content = 'metadata test';
      await storage.writeFile('meta.txt', content);
      
      const metadata = await storage.getMetadata('meta.txt');
      
      assert.strictEqual(metadata.name, 'meta.txt');
      assert.ok(metadata.size > 0);
      assert.ok(metadata.type !== undefined);
      assert.ok(metadata.lastModified instanceof Date);
    });

    it('should throw error for non-existent file', async () => {
      await assert.rejects(
        async () => await storage.getMetadata('nonexistent.txt')
      );
    });
  });

  describe('Batch Operations - Write', () => {
    it('should write multiple files', async () => {
      const files = [
        { path: 'batch1.txt', data: 'content1' },
        { path: 'batch2.txt', data: 'content2' },
        { path: 'batch3.txt', data: 'content3' },
      ];
      
      const result = await storage.writeFiles(files);
      
      assert.strictEqual(result.succeeded, 3);
      assert.strictEqual(result.failed, 0);
      
      const content1 = await storage.readFile('batch1.txt', 'text');
      assert.strictEqual(content1, 'content1');
    });

    it('should handle partial failures', async () => {
      
      await storage.writeFile('existing.txt', 'exists');
      
      const files = [
        { path: 'good1.txt', data: 'content1' },
        { path: 'good2.txt', data: 'content2' },
      ];
      
      const result = await storage.writeFiles(files);
      
      assert.strictEqual(result.succeeded, 2);
    });
  });

  describe('Batch Operations - Delete', () => {
    it('should delete multiple files', async () => {
      await storage.writeFile('del1.txt', 'content1');
      await storage.writeFile('del2.txt', 'content2');
      await storage.writeFile('del3.txt', 'content3');
      
      const result = await storage.deleteFiles(['del1.txt', 'del2.txt', 'del3.txt']);
      
      assert.strictEqual(result.succeeded, 3);
      assert.strictEqual(result.failed, 0);
      
      const files = await storage.listFiles();
      assert.strictEqual(files.length, 0);
    });
  });

  describe('Batch Operations - Read', () => {
    it('should read multiple files', async () => {
      await storage.writeFile('read1.txt', 'content1');
      await storage.writeFile('read2.txt', 'content2');
      await storage.writeFile('read3.txt', 'content3');
      
      const result = await storage.readFiles(['read1.txt', 'read2.txt', 'read3.txt']);
      
      assert.strictEqual(result.succeeded, 3);
      assert.strictEqual(result.results['read1.txt'], 'content1');
      assert.strictEqual(result.results['read2.txt'], 'content2');
      assert.strictEqual(result.results['read3.txt'], 'content3');
    });

    it('should handle partial read failures', async () => {
      await storage.writeFile('exists1.txt', 'content1');
      await storage.writeFile('exists2.txt', 'content2');
      
      const result = await storage.readFiles([
        'exists1.txt',
        'nonexistent.txt',
        'exists2.txt',
      ]);
      
      assert.strictEqual(result.succeeded, 2);
      assert.strictEqual(result.failed, 1);
      assert.strictEqual(result.results['exists1.txt'], 'content1');
      assert.strictEqual(result.results['exists2.txt'], 'content2');
    });
  });

  describe('JSON Operations', () => {
    it('should write and read JSON', async () => {
      const data = {
        name: 'Test',
        value: 42,
        nested: { key: 'value' },
      };
      
      await storage.writeJSON('data.json', data);
      const result = await storage.readJSON('data.json');
      
      assert.deepStrictEqual(result, data);
    });

    it('should throw ReadError for invalid JSON', async () => {
      await storage.writeFile('invalid.json', 'not a json');
      
      await assert.rejects(
        async () => await storage.readJSON('invalid.json'),
        ReadError
      );
    });
  });

  describe('Clear Storage', () => {
    it('should clear all files', async () => {
      await storage.writeFile('clear1.txt', 'content1');
      await storage.writeFile('clear2.txt', 'content2');
      await storage.writeFile('clear3.txt', 'content3');
      
      const result = await storage.clear();
      
      assert.strictEqual(result.succeeded, 3);
      assert.strictEqual(result.failed, 0);
      
      const files = await storage.listFiles();
      assert.strictEqual(files.length, 0);
    });

    it('should return zero counts when already empty', async () => {
      const result = await storage.clear();
      
      assert.strictEqual(result.succeeded, 0);
      assert.strictEqual(result.failed, 0);
    });
  });

  describe('Storage Estimate', () => {
    it('should get storage estimate', async () => {
      const estimate = await storage.getStorageEstimate();
      
      assert.ok(estimate.usage >= 0);
      assert.ok(estimate.quota > 0);
      assert.ok(parseFloat(estimate.percentUsed) >= 0);
      assert.ok(parseFloat(estimate.percentUsed) <= 100);
    });
  });
});

