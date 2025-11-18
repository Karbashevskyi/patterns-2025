# 🚀 Progressive Web Application - Refactored Framework

PWA with **modular architecture**, **design patterns**, and **reusable framework**.

---

## ✨ What's New (Refactoring)

### Before
- ❌ Monolithic `application.js` (250 lines)
- ❌ All code in one file
- ❌ No code reuse
- ❌ Tight coupling
- ❌ Hard to extend

### After
- ✅ **14 modular files** (~80 lines each)
- ✅ **80% reusable framework** (system code)
- ✅ **20% domain code** (app-specific)
- ✅ **5 Design Patterns** applied
- ✅ **SOLID principles** followed
- ✅ **2 working apps** on same framework

**📊 Metrics:**
- `application.js`: 250 → 25 lines (**90% reduction**)
- `worker.js`: 200 → 100 lines (**50% reduction**)
- Framework reusability: 0% → **80%**
- Applications created: 1 → **2**

---

## 🎯 Features

### Original Features
- ✅ Can be installed as a native app
- ✅ Works without internet connection
- ✅ Background sync and caching
- ✅ Native app-like experience
- ✅ Works on all devices
- ✅ Real-time notifications
- ✅ Single WebSocket connection shared across tabs
- ✅ Automatic reconnection
- ✅ HTTPS headers and CORS support

### New Features (Framework)
- ✅ **EventBus** - Observer Pattern (Pub/Sub)
- ✅ **Logger** - Centralized logging
- ✅ **NetworkMonitor** - Network status tracking
- ✅ **ServiceWorkerAdapter** - Simplified SW communication
- ✅ **InstallManager** - PWA installation handling
- ✅ **NotificationManager** - Push notifications
- ✅ **Template Method** - Easy app creation
- ✅ **Modular Service Worker** - 3 separate managers
- ✅ **Command Pattern** - Unified SW messaging

---

## 🏗️ Architecture

### Project Structure

```
pwa/Application/static/
├── framework/               # 🔧 Reusable System Code (80%)
│   ├── app-manager.js       # Template Method base
│   ├── event-bus.js         # Observer Pattern
│   ├── logger.js            # Logging
│   ├── network-monitor.js   # Network status
│   ├── commands.js          # Command Pattern
│   ├── service-worker-adapter.js  # Adapter
│   ├── install-manager.js   # PWA install
│   ├── notification-manager.js    # Notifications
│   └── index.js             # Exports
│
├── worker/                  # ⚙️ Service Worker Modules
│   ├── cache-manager.js     # Caching
│   ├── network-manager.js   # Fetch strategies
│   └── message-manager.js   # WebSocket
│
├── chat-application.js      # 💬 Chat App (domain)
├── example-application.js   # 🎯 Example App (domain)
├── application.js           # Bootstrap
├── worker.js                # SW entry point
├── index.html               # Chat UI
└── example.html             # Example UI
```

### Design Patterns

| Pattern | Component | Purpose |
|---------|-----------|---------|
| **Template Method** | AppManager | Initialization algorithm |
| **Observer** | EventBus | Loose coupling |
| **Command** | Commands | SW messaging |
| **Adapter** | ServiceWorkerAdapter | Simple SW API |
| **Mediator** | EventBus | Central communication |

---

## 📱 Applications

### 1. ChatApplication (`index.html`)
- 💬 WebSocket chat
- 📤 Send/receive messages
- 🔄 Cache management
- 📱 PWA installation

**URL:** `http://localhost:8000/Application/static/index.html`

### 2. ExampleApplication (`example.html`)
- 🔢 Counter (increment/decrement/reset)
- 🔄 Cache management
- 📱 PWA installation
- 📋 Logging demo

**URL:** `http://localhost:8000/Application/static/example.html`

---

## 🚀 Installation & Usage

### Prerequisites
- Node.js 18+

### Steps

1. **Clone & Navigate:**
   ```bash
   cd pwa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start server:**
   ```bash
   node server.js
   ```

4. **Open browser:**
   - Chat App: `http://localhost:8000/Application/static/index.html`
   - Example App: `http://localhost:8000/Application/static/example.html`

---

## 🛠️ Creating New Application

**3 simple steps:**

### 1. Create class (extends AppManager)

```javascript
// my-app.js
import { AppManager } from './framework/app-manager.js';

export class MyApp extends AppManager {
  setupUI() {
    this.elements = {
      myButton: document.getElementById('my-button'),
    };
  }

  setupEventHandlers() {
    super.setupEventHandlers();
    this.elements.myButton?.addEventListener('click', () => {
      this.logger.info('Clicked!');
    });
  }
}
```

### 2. Create HTML

```html
<!DOCTYPE html>
<html>
<body>
  <button id="my-button">Click</button>
  <div id="output"></div>

  <script type="module">
    import { MyApp } from './my-app.js';
    const app = new MyApp({ logOutputId: 'output' });
    await app.initialize();
  </script>
</body>
</html>
```

### 3. Done! 🎉

You automatically get:
- Service Worker
- Offline support
- Caching
- Network monitoring
- PWA installation
- Logging
- Event bus

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `REFACTORING.md` | Full architecture docs (450+ lines) |
| `REFACTORING_SUMMARY.md` | Quick overview (150 lines) |
| `USAGE_EXAMPLES.md` | Practical examples (700+ lines) |
| `README.md` | This file |

**Quick Start:**
1. Read `REFACTORING_SUMMARY.md`
2. Check `example-application.js`
3. Create your app

**Deep Dive:**
1. Read `REFACTORING.md`
2. Study `USAGE_EXAMPLES.md`
3. Analyze `framework/` code

---

## 🎓 Learning Value

This project demonstrates:

### Design Patterns
- Template Method
- Observer (Pub/Sub)
- Command
- Adapter
- Mediator

### SOLID Principles
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### Best Practices
- Separation of Concerns
- DRY (Don't Repeat Yourself)
- Loose Coupling
- High Cohesion
- Code Reusability

---

## 📊 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full support |
| Firefox | 75+ | ✅ Full support |
| Safari | 13+ | ✅ Full support |
| Edge | 80+ | ✅ Full support |

---

## 📄 License

Copyright (c) 2025 How.Programming.Works contributors

Educational project for design patterns demonstration.

---

**Happy coding!** 🚀

*Made with ❤️ for learning Design Patterns*
