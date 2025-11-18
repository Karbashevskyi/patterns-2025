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

---

## 🧪 Testing (Added)

### Native Node.js Test Runner

Проект використовує **вбудований test runner Node.js v18+** - без залежностей від Jest, Mocha чи інших фреймворків!

### Запуск тестів

```bash
# Основний unit test (Strategy Pattern + Code Quality)
npm run test:week-8

# Watch mode - автоматичний перезапуск при змінах
npm run test:week-8:watch

# З покриттям коду
npm run test:week-8:coverage

# Або безпосередньо:
node --test week-8/storage.unit.test.js
```

### Тестові файли

1. **`storage.unit.test.js`** ✅ (основний)
   - Unit tests для Strategy Pattern
   - Validation code quality improvements
   - Error handling refactoring tests
   - **16 tests, 100% pass rate**
   - Не потребує browser APIs

2. **`opfs-storage.test.js`** 🌐 (integration, requires browser)
   - Integration tests для OPFS
   - Requires browser environment with OPFS support
   - ~300 lines, 15+ test suites

3. **`file-system-storage.test.js`** 🌐 (integration, with mocks)
   - Integration tests для File System Access API
   - Uses mocks to avoid real file pickers
   - ~500 lines, 15+ test suites with mock helpers

### Що покривають unit tests

✅ **Strategy Pattern Implementation**
- Read strategies structure (text, arrayBuffer, blob)
- Strategy behavior validation
- Unsupported type detection
- Consistency between OPFS and File System implementations

✅ **Error Handling Refactoring**
- Single `escalateError()` call instead of triple
- Variable storage for escalated errors
- Performance and readability improvements

✅ **Code Quality**
- Strategy Pattern vs Switch Statement comparison
- Extension capability (Open/Closed Principle)
- Strategy selection logic
- Single Responsibility Principle

✅ **SOLID Principles**
- Open/Closed Principle compliance
- Single Responsibility validation

### Test Output

```
✅ All unit tests validate Strategy Pattern implementation

▶ Storage Strategy Pattern Tests
  ✔ OPFSStorage - Strategy Pattern (5 tests)
  ✔ FileSystemStorage - Strategy Pattern (2 tests)
  ✔ Error Handling Refactoring (2 tests)
  ✔ Batch Operations Pattern (1 test)
  ✔ Strategy Selection Logic (2 tests)
  ✔ Code Quality Improvements (2 tests)
  ✔ Single Responsibility Principle (1 test)
  ✔ Open/Closed Principle (1 test)

ℹ tests 16
ℹ pass 16
ℹ fail 0
ℹ duration_ms ~70
```

### Чому Native Node.js Test Runner?

**Переваги:**
- ✅ Вбудований в Node.js 18+ (LTS)
- ✅ Не потребує `npm install` зовнішніх пакетів
- ✅ Швидкий запуск і виконання
- ✅ Watch mode з `--watch` флагом
- ✅ Coverage з `--experimental-test-coverage`
- ✅ Syntax близький до Jest/Mocha (`describe`, `it`, `assert`)

**Приклад тесту:**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Strategy Pattern', () => {
  it('should select correct strategy', () => {
    const strategies = {
      text: 'text-handler',
      arrayBuffer: 'arrayBuffer-handler',
      blob: 'blob-handler',
    };
    
    assert.strictEqual(strategies['text'], 'text-handler');
  });
});
```

### Рефакторинг: Switch → Strategy Pattern

**До (Switch Statement):**

```javascript
switch (type) {
  case 'text':
    return await file.text();
  case 'arrayBuffer':
    return await file.arrayBuffer();
  case 'blob':
    return file;
  default:
    throw new Error('Unsupported type');
}
```

**Після (Strategy Pattern):**

```javascript
#readStrategies = {
  text: async (file) => await file.text(),
  arrayBuffer: async (file) => await file.arrayBuffer(),
  blob: (file) => file,
};

const strategy = this.#readStrategies[type];
if (!strategy) throw new Error(`Unsupported type: ${type}`);
return await strategy(file);
```

**Результат:**
- ✅ Легко додавати нові стратегії (просто додати в об'єкт)
- ✅ Open/Closed Principle - відкрито для розширення, закрито для модифікації
- ✅ Кращу читабельність коду
- ✅ Відокремлення логіки вибору від виконання

### Рефакторинг: Error Handling

**До (Triple escalateError calls):**

```javascript
throw escalateError(error, params) instanceof WriteError 
  ? escalateError(error, params) 
  : new WriteError(escalateError(error, params));
```

**Після (Single call):**

```javascript
const escalated = escalateError(error, params);
throw escalated instanceof WriteError 
  ? escalated 
  : new WriteError(escalated);
```

**Результат:**
- ✅ Performance boost (3x → 1x виклик функції)
- ✅ Більш читабельний код
- ✅ Легше для дебагінгу

