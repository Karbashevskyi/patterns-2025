# Week 10: Storage-Agnostic Layer

> **Offline-first browser storage with interchangeable OPFS and IndexedDB implementations**

## 📚 Overview

This week demonstrates the **Adapter Pattern** to create a storage-agnostic layer over both **OPFS (Origin Private File System)** and **IndexedDB**. The implementation provides a unified interface for CRUD operations, allowing you to switch between storage backends without changing application code.

## 🎯 Key Concepts

- **Adapter Pattern**: Converts incompatible interfaces into a common interface
- **Dependency Inversion**: Application depends on abstraction, not concrete implementations
- **Interface Segregation**: Small, focused interface for storage operations
- **Offline-first**: Client-side storage for Progressive Web Apps (PWAs)

## 📁 Project Structure

```
week-10/
├── task.md                    # Task description and architecture
├── storage-interface.js       # Common IStorage interface
├── opfs-storage.js           # OPFS implementation
├── indexeddb-storage.js      # IndexedDB implementation
├── storage-factory.js        # Factory and migration utilities
├── demo.html                 # Interactive browser demo
├── tests.js                  # Test suite for both implementations
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Open the Demo

Simply open `demo.html` in a modern web browser:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000/week-10/demo.html
```

### 2. Run Tests

Test both storage implementations in the browser:

```bash
# Serve the files
python3 -m http.server 8000

# Then open http://localhost:8000/week-10/test-runner.html
# Click "Run All Tests" button
```

**Note**: Tests must run in a browser environment because they use browser-specific APIs (IndexedDB, OPFS). The `tests.js` file is also available but requires a browser environment to execute.

## 💻 Usage Examples

### Basic CRUD Operations

```javascript
import { createStorage } from './storage-factory.js';

// Create storage (auto-selects best available)
const storage = await createStorage('my-users');

// Create a record
await storage.create({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
});

// Read a record
const user = await storage.read('user-1');
console.log(user); // { id: 'user-1', name: 'John Doe', ... }

// Update a record
await storage.update('user-1', { name: 'Jane Doe' });

// Delete a record
await storage.delete('user-1');

// Read all records
const allUsers = await storage.readAll();

// Count records
const count = await storage.count();

// Check if record exists
const exists = await storage.exists('user-1');

// Delete all records
await storage.deleteAll();

// Close storage
await storage.close();
```

### Explicit Storage Type Selection

```javascript
import { createStorage } from './storage-factory.js';

// Use IndexedDB explicitly
const indexedDB = await createStorage('users', 'indexeddb');

// Use OPFS explicitly
const opfs = await createStorage('users', 'opfs');

// Auto-select (recommended)
const auto = await createStorage('users', 'auto');
```

### Using the Factory Directly

```javascript
import { StorageFactory } from './storage-factory.js';

// Check available storage types
const available = StorageFactory.getAvailableTypes();
console.log(available); // ['indexeddb', 'opfs']

// Get recommended type
const recommended = StorageFactory.getRecommended();
console.log(recommended); // 'indexeddb'

// Check if specific type is available
const hasOPFS = StorageFactory.isAvailable('opfs');

// Create storage with factory
const storage = await StorageFactory.create('indexeddb', 'my-storage');
```

### Storage Migration

```javascript
import { createStorage, StorageMigration } from './storage-factory.js';

// Create source and target storages
const sourceStorage = await createStorage('old-db', 'indexeddb');
const targetStorage = await createStorage('new-db', 'opfs');

// Migrate all data
const result = await StorageMigration.migrate(
  sourceStorage,
  targetStorage,
  {
    deleteSource: false, // Keep source data
    onProgress: (progress) => {
      console.log(`Progress: ${progress.current}/${progress.total}`);
    }
  }
);

console.log(`Migrated: ${result.success} success, ${result.failed} failed`);

// Compare storages for consistency
const comparison = await StorageMigration.compare(sourceStorage, targetStorage);
console.log(comparison.equal); // true if identical
```

## 🏗️ Architecture

### Interface (IStorage)

All storage implementations must implement these methods:

```javascript
class IStorage {
  async create(record)      // Create new record
  async read(id)           // Read single record
  async readAll()          // Read all records
  async update(id, updates) // Update existing record
  async delete(id)         // Delete record
  async deleteAll()        // Delete all records
  async exists(id)         // Check if record exists
  async count()            // Count total records
  getName()                // Get storage name
  getType()                // Get storage type
  async close()            // Close/cleanup
}
```

### OPFS Implementation

- **Storage**: One JSON file per record
- **Directory**: Named after storage instance
- **Location**: `navigator.storage.getDirectory()`
- **Best for**: Large files, binary data

### IndexedDB Implementation

- **Storage**: Object store with `id` as key path
- **Database**: Named after storage instance
- **Transactions**: Automatic transaction handling
- **Best for**: Structured data, wide browser support

## 🔍 Feature Comparison

| Feature | IndexedDB | OPFS |
|---------|-----------|------|
| Browser Support | ✅ Excellent | ⚠️ Limited (newer browsers) |
| API Complexity | ⚠️ Complex | ⚠️ Complex |
| Performance (small data) | ✅ Fast | ✅ Fast |
| Performance (large files) | ⚠️ Slower | ✅ Faster |
| Transactions | ✅ Built-in | ❌ Manual |
| Indexing | ✅ Yes | ❌ No |
| File-like access | ❌ No | ✅ Yes |
| Private storage | ✅ Yes | ✅ Yes |

## 🧪 Testing

The test suite validates that both implementations:

1. ✅ Follow the same interface
2. ✅ Handle CRUD operations correctly
3. ✅ Throw appropriate errors
4. ✅ Preserve all data properties
5. ✅ Support concurrent operations
6. ✅ Can be migrated between each other

Run tests:

```bash
node tests.js
```

Expected output:
```
✅ should create a new record
✅ should read an existing record
✅ should update an existing record
✅ should delete a record
...
🎉 All tests passed! Storage implementations are fully compatible!
```

## 🎨 Demo Features

The interactive demo (`demo.html`) showcases:

- **Storage selection**: Switch between OPFS and IndexedDB
- **Capability detection**: Shows which storage types are available
- **CRUD operations**: Full create, read, update, delete interface
- **Live statistics**: Real-time record count and storage info
- **Data persistence**: Records survive page refreshes
- **Error handling**: Graceful error messages

## 📊 Use Cases

### 1. Progressive Web Apps (PWAs)

```javascript
// Offline-first todo app
const todos = await createStorage('todos', 'auto');

// Works offline
await todos.create({
  id: crypto.randomUUID(),
  title: 'Buy groceries',
  completed: false,
  createdAt: Date.now()
});

// Sync when online
if (navigator.onLine) {
  const allTodos = await todos.readAll();
  await syncToServer(allTodos);
}
```

### 2. Client-Side Caching

```javascript
// Cache API responses
const cache = await createStorage('api-cache', 'indexeddb');

async function fetchWithCache(url) {
  const cached = await cache.read(url);
  
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  await cache.create({
    id: url,
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

### 3. Draft/Auto-Save

```javascript
// Auto-save form data
const drafts = await createStorage('drafts', 'auto');

// Save every 30 seconds
setInterval(async () => {
  const formData = getFormData();
  await drafts.update('current-draft', formData);
}, 30000);

// Restore on load
const draft = await drafts.read('current-draft');
if (draft) {
  restoreFormData(draft);
}
```

## 🔧 Advanced Configuration

### Custom IndexedDB Version

```javascript
const storage = await StorageFactory.create('indexeddb', 'my-db', {
  version: 2 // Custom database version
});
```

### Error Handling

```javascript
try {
  await storage.create({ id: 'duplicate', name: 'Test' });
  await storage.create({ id: 'duplicate', name: 'Test' }); // Error!
} catch (error) {
  console.error(error.message); // "Record with id 'duplicate' already exists"
}
```

## 🚨 Browser Support

### IndexedDB
- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+
- ✅ Mobile browsers

### OPFS
- ✅ Chrome 86+
- ✅ Edge 86+
- ⚠️ Firefox (behind flag)
- ⚠️ Safari (limited support)

**Recommendation**: Use `createStorage('name', 'auto')` for automatic fallback to best available storage.

## 📝 Design Principles

### 1. **Dependency Inversion Principle**
Application code depends on `IStorage` interface, not concrete implementations.

### 2. **Open/Closed Principle**
Easy to add new storage adapters (Memory, LocalStorage, etc.) without modifying existing code.

### 3. **Interface Segregation Principle**
Small, focused interface with only essential CRUD operations.

### 4. **Single Responsibility Principle**
Each adapter responsible only for its storage mechanism.

## 🎓 Learning Outcomes

After completing this week, you should understand:

1. ✅ How to use the Adapter Pattern for API abstraction
2. ✅ OPFS and IndexedDB APIs
3. ✅ Storage-agnostic architecture
4. ✅ Offline-first application design
5. ✅ Data migration strategies
6. ✅ Progressive enhancement patterns

## 🔗 Related Patterns

- **Strategy Pattern**: Different storage strategies
- **Factory Pattern**: Creating storage instances
- **Template Method**: Common storage operations
- **Repository Pattern**: Data access abstraction

## 📚 Resources

- [OPFS Documentation](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [Offline-First Apps](https://offlinefirst.org/)

## 🎉 Conclusion

The storage-agnostic approach provides **flexibility**, **testability**, and **future-proofing** for client-side storage. By programming to an interface rather than concrete implementations, we create more maintainable and adaptable applications—essential for offline-first and Progressive Web Apps.

---

**Week 10 Complete!** ✨

You now have a production-ready storage abstraction layer that works across different browser APIs. The same interface works with OPFS, IndexedDB, and can easily be extended to support other storage mechanisms like Memory, LocalStorage, or even remote APIs.
