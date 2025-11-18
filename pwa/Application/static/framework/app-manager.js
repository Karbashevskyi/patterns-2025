import { EventBus } from './event-bus.js';
import { Logger } from './logger.js';
import { NetworkMonitor } from './network-monitor.js';
import { ServiceWorkerAdapter } from './service-worker-adapter.js';
import { InstallManager } from './install-manager.js';
import { NotificationManager } from './notification-manager.js';
import { CommandFactory } from './commands.js';

export class AppManager {
  constructor(config = {}) {
    this.eventBus = new EventBus();
    
    this.logger = new Logger(config.logOutputId || 'output', config.loggerOptions);
    this.network = new NetworkMonitor(this.eventBus);
    this.worker = new ServiceWorkerAdapter(this.eventBus);
    this.install = new InstallManager(this.eventBus);
    this.notifications = new NotificationManager(this.eventBus);
    
    this.clientId = this.#getOrCreateClientId();
    this.config = config;
    
    this.#setupSystemEventHandlers();
  }

  async initialize() {
    this.logger.info('Initializing application...');
    
    await this.#initializeServiceWorker();
    this.setupUI();
    this.setupEventHandlers();
    this.#connect();
    this.#startHeartbeat();
    
    this.logger.info('Application initialized successfully');
    
    await this.onInitialized();
  }

  async onInitialized() {
  }

  setupUI() {
    throw new Error('setupUI() must be implemented by subclass');
  }

  setupEventHandlers() {
  }

  sendCommand(command) {
    const sent = this.worker.send(command);
    if (sent) {
      this.logger.info('Command sent:', command.type);
    }
    return sent;
  }

  sendMessage(content) {
    if (!content) {
      this.eventBus.emit('app:error', { message: 'Message content is empty' });
      return;
    }
    
    const command = CommandFactory.message(content);
    this.sendCommand(command);
    this.logger.info('Message sent:', content);
  }

  updateCache() {
    this.logger.info('Requesting cache update...');
    const command = CommandFactory.updateCache();
    this.sendCommand(command);
  }

  async installApp() {
    if (!this.install.isAvailable()) {
      this.logger.warn('Install prompt not available');
      return;
    }
    
    try {
      const outcome = await this.install.install();
      this.logger.info('Install prompt', outcome);
    } catch (error) {
      this.logger.error('Install failed:', error.message);
    }
  }
  
  clearLog() {
    this.logger.clear();
  }

  destroy() {
    const command = CommandFactory.disconnect();
    this.sendCommand(command);
    this.eventBus.clear();
    this.logger.info('Application destroyed');
  }

  #getOrCreateClientId() {
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
      clientId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('clientId', clientId);
    }
    return clientId;
  }

  async #initializeServiceWorker() {
    try {
      await this.worker.initialize(this.config.workerPath);
      this.logger.info('Service Worker initialized');
    } catch (error) {
      this.logger.error('Service Worker initialization failed:', error.message);
      throw error;
    }
  }

  #connect() {
    const command = CommandFactory.connect(this.clientId);
    this.sendCommand(command);
  }

  #startHeartbeat() {
    setInterval(() => {
      const command = CommandFactory.ping();
      this.sendCommand(command);
    }, 25000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const command = CommandFactory.ping();
        this.sendCommand(command);
      }
    });
  }

  async #requestNotificationPermission() {
    const granted = await this.notifications.requestPermission();
    this.logger.info('Notification permission:', granted ? 'granted' : 'denied');
    return granted;
  }

  async requestNotificationPermission() {
    return await this.#requestNotificationPermission();
  }

  async resetApp() {
    this.logger.info('Resetting application...');
    
    try {
      const command = CommandFactory.disconnect();
      this.sendCommand(command);
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          this.logger.info('Service Worker unregistered');
        }
      }
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          this.logger.info('Cache deleted:', cacheName);
        }
      }
      
      localStorage.clear();
      this.logger.info('LocalStorage cleared');
      
      sessionStorage.clear();
      this.logger.info('SessionStorage cleared');
      
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            this.logger.info('IndexedDB deleted:', db.name);
          }
        }
      }
      
      this.logger.info('Application reset completed! Reloading page...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      this.logger.error('Reset failed:', error);
      throw error;
    }
  }

  #setupSystemEventHandlers() {
    this.eventBus.on('network:online', () => {
      this.logger.info('Network: Online');
      const command = CommandFactory.networkStatus(true);
      this.sendCommand(command);
    });

    this.eventBus.on('network:offline', () => {
      this.logger.warn('Network: Offline');
      const command = CommandFactory.networkStatus(false);
      this.sendCommand(command);
    });

    this.eventBus.on('worker:status', (data) => {
      this.logger.info('Service Worker status:', data.connected ? 'connected' : 'disconnected');
      
      if (data.connected) {
        this.notifications.showIfHidden('Connected', {
          body: 'WebSocket connection established',
          tag: 'connection-status',
          icon: '/icon.svg',
        });
      }
    });

    this.eventBus.on('worker:message', (data) => {
      this.logger.info('Message received:', data.content);
      
      // Показати системне notification якщо користувач не на сторінці
      if (data.content) {
        this.notifications.showIfHidden('New Message', {
          body: data.content,
          tag: 'chat-message',
          requireInteraction: false,
        });
      }
    });

    this.eventBus.on('worker:userJoined', (data) => {
      const shortId = data.clientId.substring(0, 8);
      this.logger.info(`User joined: ${shortId} (Total: ${data.count})`);
    });

    this.eventBus.on('worker:userLeft', (data) => {
      const shortId = data.clientId.substring(0, 8);
      this.logger.info(`User left: ${shortId} (Total: ${data.count})`);
    });

    this.eventBus.on('worker:error', (data) => {
      this.logger.error('Service Worker error:', data.error);
    });

    this.eventBus.on('worker:cacheUpdated', () => {
      this.logger.info('Cache updated successfully');
    });

    this.eventBus.on('worker:cacheUpdateFailed', (data) => {
      this.logger.error('Cache update failed:', data.error);
    });

    this.eventBus.on('install:available', () => {
      this.logger.info('Install prompt available');
    });

    this.eventBus.on('install:completed', () => {
      this.logger.info('App installed successfully');
    });

    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }
}
