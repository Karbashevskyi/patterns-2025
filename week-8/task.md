# Week 8: Handling Errors: Exceptions and Soft Failures

## Task Description

Implement abstraction over File System Web API and OPFS (Origin Private File System) to store data in browser as we have in wrapper written for indexedDB (see week 6 task).

## Requirements

1. **Error Aggregation**: Use `AggregateError` to collect multiple errors that might occur during batch operations
2. **Error Escalation**: Use `.cause` property to chain errors and/or generate higher-level domain-specific errors instead of intercepted low-level ones
3. **File System Abstraction**: Create a wrapper over:
   - File System Access API (user-visible file system)
   - OPFS - Origin Private File System (browser private storage)
4. **API Design**: Similar to IndexedDB wrapper pattern with:
   - Consistent error handling
   - Promise-based API
   - Domain-specific error types

## Key Concepts

### Error Escalation
Transform low-level errors into domain-specific errors while preserving the original error chain:
```javascript
throw new FileSystemError('Failed to save user data', { cause: originalError });
```

### Error Aggregation
Collect multiple errors from batch operations:
```javascript
const errors = [];
// ... collect errors during batch operations
if (errors.length > 0) {
  throw new AggregateError(errors, 'Multiple files failed to process');
}
```

## File System APIs

### OPFS (Origin Private File System)
- Private storage area per origin
- Fast, direct file access
- Not visible to user
- Access via `navigator.storage.getDirectory()`

### File System Access API
- User-selectable files/directories
- Requires user permission
- Files visible in OS file system
- Access via `window.showOpenFilePicker()`, `window.showSaveFilePicker()`, etc.

## Implementation Files

1. `errors.js` - Custom error classes
2. `opfs-storage.js` - OPFS abstraction layer
3. `file-system-storage.js` - File System Access API wrapper
4. `demo.html` - Browser-based demo and tests
5. `README.md` - Documentation and usage examples
