# Week 8: File System API Abstraction

## Overview

This week's implementation demonstrates proper error handling patterns using:
- **Error Escalation**: Converting low-level errors to domain-specific errors with `.cause` chains
- **Error Aggregation**: Collecting multiple errors from batch operations using `AggregateError`

## Files

### Core Implementation

1. **`errors.js`** - Domain-specific error classes
   - `FileSystemError` - Base error class
   - `FileNotFoundError`, `PermissionDeniedError`, `QuotaExceededError`, etc.
   - `BatchOperationError` - Extends `AggregateError`
   - `escalateError()` - Maps low-level exceptions to domain errors
   - `ErrorCollector` - Utility for collecting errors during batch operations

2. **`opfs-storage.js`** - OPFS (Origin Private File System) abstraction
   - `OPFSStorage` class - Wrapper around OPFS APIs
   - File operations: read, write, delete, list
   - JSON helpers: `readJSON()`, `writeJSON()`
   - Batch operations with error aggregation
   - Storage quota management

3. **`file-system-storage.js`** - File System Access API wrapper
   - `FileSystemStorage` class - Wrapper around File System Access API
   - User file/directory pickers
   - Permission handling
   - Batch operations with error aggregation

4. **`demo.html`** - Interactive browser demo
   - Live demonstrations of all features
   - Error handling examples
   - API support detection
   - Storage usage statistics

## Key Concepts

### Error Escalation

Instead of exposing low-level `DOMException` errors, we escalate them to domain-specific errors while preserving the original error chain:

```javascript
try {
  const fileHandle = await this.rootDir.getFileHandle(path);
} catch (error) {
  // Escalate DOMException to domain-specific FileNotFoundError
  throw new FileNotFoundError(path, { cause: error });
}
```

Error chains can be inspected:
```javascript
error.name // 'FileNotFoundError'
error.cause.name // 'NotFoundError' (original DOMException)
```

### Error Aggregation

Batch operations collect all errors instead of failing on the first one:

```javascript
async writeFiles(files) {
  const collector = new ErrorCollector('writeFiles');
  
  for (const { path, data } of files) {
    try {
      await this.writeFile(path, data);
      collector.addSuccess();
    } catch (error) {
      collector.addError(error, { path });
    }
  }
  
  // Throws BatchOperationError if any failures occurred
  collector.throwIfErrors();
}
```

The resulting `BatchOperationError` extends `AggregateError`:
```javascript
error.errors // Array of all collected errors
error.successCount // Number of successful operations
error.failureCount // Number of failed operations
```

## Usage Examples

### OPFS Storage

```javascript
import { OPFSStorage } from './opfs-storage.js';

const storage = new OPFSStorage();
await storage.init();

// Write file
await storage.writeFile('data.txt', 'Hello World');

// Read file
const content = await storage.readFile('data.txt');

// Write JSON
await storage.writeJSON('config.json', { setting: 'value' });

// Batch operations
await storage.writeFiles([
  { path: 'file1.txt', data: 'content1' },
  { path: 'file2.txt', data: 'content2' },
]);

// List files
const files = await storage.listFiles();

// Storage stats
const stats = await storage.getStorageEstimate();
```

### File System Access API

```javascript
import { FileSystemStorage } from './file-system-storage.js';

const storage = new FileSystemStorage();

// Pick and read a file
const fileHandle = await storage.pickFile();
if (fileHandle) {
  const content = await storage.readFile(fileHandle);
}

// Pick and read multiple files
const handles = await storage.pickFiles();
const result = await storage.readFiles(handles);
// result.results contains successful reads
// result.errors contains any failures

// Save a file
const saveHandle = await storage.pickFileForSave();
if (saveHandle) {
  await storage.writeFile(saveHandle, 'content');
}

// Pick and list directory
const dirHandle = await storage.pickDirectory();
const entries = await storage.listDirectory(dirHandle);
```

### Error Handling

```javascript
try {
  await storage.readFile('nonexistent.txt');
} catch (error) {
  console.log(error.name); // 'FileNotFoundError'
  console.log(error.message); // 'File or directory not found: nonexistent.txt'
  console.log(error.cause); // Original DOMException
}

// Batch operations with partial success
try {
  await storage.deleteFiles(['file1.txt', 'missing.txt', 'file2.txt']);
} catch (error) {
  if (error instanceof BatchOperationError) {
    console.log(`Succeeded: ${error.successCount}`);
    console.log(`Failed: ${error.failureCount}`);
    error.errors.forEach(err => console.error(err));
  }
}
```

## Running the Demo

1. Open `demo.html` in a modern browser (Chrome 86+, Edge 86+)
2. The page will detect API support automatically
3. Try different operations:
   - OPFS operations (automatic, no permissions needed)
   - File System Access API operations (require user file selection)
   - Error demonstrations showing escalation and aggregation

## Browser Support

- **OPFS**: Chrome 86+, Edge 86+, Opera 72+
- **File System Access API**: Chrome 86+, Edge 86+, Opera 72+

Both APIs are currently not supported in Firefox or Safari.

## Design Patterns Used

1. **Facade Pattern**: Simplified interface over complex File System APIs
2. **Error Escalation**: Converting low-level to high-level errors
3. **Error Aggregation**: Collecting multiple errors with `AggregateError`
4. **Builder Pattern**: `ErrorCollector` for constructing error summaries
5. **Singleton Pattern**: Storage instances manage single connections

## Learning Points

- **Error chains**: Use `{ cause: originalError }` to preserve error context
- **Domain errors**: Create specific error types for better error handling
- **Partial failures**: Batch operations can succeed partially
- **Error recovery**: Collect errors instead of failing fast
- **Type safety**: Custom errors carry context (path, operation, etc.)
