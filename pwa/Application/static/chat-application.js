import { AppManager } from './framework/app-manager.js';

export class ChatApplication extends AppManager {
  constructor(config = {}) {
    super({
      logOutputId: 'output',
      workerPath: './worker.js',
      ...config,
    });

    this.elements = {};
  }

  setupUI() {
    this.elements = {
      installBtn: document.getElementById('install-btn'),
      enableNotificationsBtn: document.getElementById('enable-notifications-btn'),
      sendMessageBtn: document.getElementById('send-message-btn'),
      updateCacheBtn: document.getElementById('update-cache-btn'),
      resetAppBtn: document.getElementById('reset-app-btn'),
      clearBtn: document.getElementById('clear-btn'),
      sendBtn: document.getElementById('send-btn'),
      
      messageInput: document.getElementById('message-input'),
      
      connectionStatus: document.getElementById('connection-status'),
      installStatus: document.getElementById('install-status'),
      notification: document.getElementById('notification'),
    };

    this.#validateElements();
    this.#updateConnectionStatus();
    this.#updateNotificationButton();
  }

  setupEventHandlers() {
    super.setupEventHandlers();

    this.#setupButtonHandlers();
    this.#setupInputHandlers();
    this.#setupApplicationEvents();
  }

  async onInitialized() {
    this.logger.info('Chat application ready');
    this.#showNotification('Chat application ready', 'success');
  }

  sendMessageFromUI() {
    const content = this.elements.messageInput?.value?.trim();
    
    if (!content) {
      this.#showNotification('Please enter a message', 'warning');
      return;
    }

    if (!this.network.isOnline()) {
      this.#showNotification('Cannot send message: offline', 'error');
      return;
    }

    this.sendMessage(content);
    this.elements.messageInput.value = '';
    this.#showNotification('Message sent', 'success');
  }

  async updateCacheFromUI() {
    this.#disableButton(this.elements.updateCacheBtn, 'Updating...');
    
    try {
      this.updateCache();
      this.#showNotification('Cache update requested', 'info');
    } catch (error) {
      this.logger.error('Failed to request cache update:', error);
      this.#showNotification('Failed to update cache', 'error');
      this.#enableButton(this.elements.updateCacheBtn, 'Update Cache');
    }
  }

  async installFromUI() {
    try {
      await this.installApp();
    } catch (error) {
      this.#showNotification('Install failed', 'error');
    }
  }

  #validateElements() {
    const required = ['messageInput', 'sendBtn', 'connectionStatus'];
    const missing = required.filter((key) => !this.elements[key]);
    
    if (missing.length > 0) {
      console.warn('Missing UI elements:', missing);
    }
  }

  #setupButtonHandlers() {
    this.elements.installBtn?.addEventListener('click', () => {
      this.installFromUI();
    });

    this.elements.enableNotificationsBtn?.addEventListener('click', async () => {
      await this.requestNotificationPermission();
      this.#updateNotificationButton();
    });

    this.elements.sendMessageBtn?.addEventListener('click', () => {
      this.sendMessageFromUI();
    });

    this.elements.sendBtn?.addEventListener('click', () => {
      this.sendMessageFromUI();
    });

    this.elements.updateCacheBtn?.addEventListener('click', () => {
      this.updateCacheFromUI();
    });

    this.elements.resetAppBtn?.addEventListener('click', async () => {
      if (confirm('⚠️ This will delete ALL app data (Service Worker, caches, storage). Continue?')) {
        try {
          this.#disableButton(this.elements.resetAppBtn, 'Resetting...');
          await this.resetApp();
        } catch (error) {
          this.#showNotification('Reset failed: ' + error.message, 'error');
          this.#enableButton(this.elements.resetAppBtn, 'Reset App');
        }
      }
    });

    this.elements.clearBtn?.addEventListener('click', () => {
      this.clearLog();
    });
  }

  #setupInputHandlers() {
    this.elements.messageInput?.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.sendMessageFromUI();
      }
    });
  }

  #setupApplicationEvents() {
    this.eventBus.on('network:online', () => {
      this.#updateConnectionStatus();
      this.#updateButtonStates();
      this.#showNotification('Back online', 'success');
    });

    this.eventBus.on('network:offline', () => {
      this.#updateConnectionStatus();
      this.#updateButtonStates();
      this.#showNotification('You are offline', 'warning');
    });

    this.eventBus.on('worker:status', (data) => {
      if (data.connected) {
        this.#showNotification('Connected', 'success');
      } else {
        this.#showNotification('Disconnected', 'warning');
      }
    });

    this.eventBus.on('worker:message', (data) => {
      this.#showNotification(`Message: ${data.content}`, 'info');
    });

    this.eventBus.on('worker:cacheUpdated', () => {
      this.#enableButton(this.elements.updateCacheBtn, 'Update Cache');
      this.#showNotification('Cache updated!', 'success');
    });

    this.eventBus.on('worker:cacheUpdateFailed', () => {
      this.#enableButton(this.elements.updateCacheBtn, 'Update Cache');
      this.#showNotification('Cache update failed', 'error');
    });

    // Інсталяція
    this.eventBus.on('install:available', () => {
      this.#showInstallButton();
      this.#showNotification('App can be installed', 'info');
    });

    this.eventBus.on('install:completed', () => {
      this.#hideInstallButton();
      this.#showNotification('App installed!', 'success');
    });

    this.eventBus.on('install:choice', ({ outcome }) => {
      if (outcome === 'dismissed') {
        this.#hideInstallButton();
      }
    });
  }

  #updateConnectionStatus() {
    const { connectionStatus } = this.elements;
    if (!connectionStatus) return;

    const status = this.network.isOnline() ? 'online' : 'offline';
    connectionStatus.textContent = status.toUpperCase();
    connectionStatus.className = `status-indicator ${status}`;
  }

  #updateNotificationButton() {
    const { enableNotificationsBtn } = this.elements;
    if (!enableNotificationsBtn) return;

    const permission = Notification.permission;
    
    if (permission === 'granted') {
      enableNotificationsBtn.textContent = '✓ Notifications Enabled';
      enableNotificationsBtn.disabled = true;
      enableNotificationsBtn.classList.add('success');
    } else if (permission === 'denied') {
      enableNotificationsBtn.textContent = '✗ Notifications Blocked';
      enableNotificationsBtn.disabled = true;
      enableNotificationsBtn.classList.add('error');
    } else {
      enableNotificationsBtn.textContent = 'Enable Notifications';
      enableNotificationsBtn.disabled = false;
    }
  }

  #updateButtonStates() {
    const { sendMessageBtn, sendBtn } = this.elements;
    if (sendMessageBtn) sendMessageBtn.disabled = !this.network.isOnline();
    if (sendBtn) sendBtn.disabled = !this.network.isOnline();
  }

  #showInstallButton() {
    this.elements.installBtn?.classList.remove('hidden');
    this.elements.installStatus?.classList.remove('hidden');
  }

  #hideInstallButton() {
    this.elements.installBtn?.classList.add('hidden');
    this.elements.installStatus?.classList.add('hidden');
  }

  #showNotification(message, type = 'info') {
    const { notification } = this.elements;
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }

  #disableButton(button, text) {
    if (!button) return;
    button.disabled = true;
    button.textContent = text;
  }

  #enableButton(button, text) {
    if (!button) return;
    button.disabled = false;
    button.textContent = text;
  }
}
