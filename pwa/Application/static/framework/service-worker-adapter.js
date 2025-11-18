import { EventBus } from './event-bus.js';

export class ServiceWorkerAdapter {
  #worker;
  #eventBus;
  #messageHandlers = new Map();

  constructor(eventBus) {
    this.#eventBus = eventBus || new EventBus();
    this.ready = false;
  }

  async initialize(workerPath = './worker.js') {
    try {
      const registration = await navigator.serviceWorker.register(workerPath, {
        type: 'module',
        scope: '/',
      });
      
      await navigator.serviceWorker.ready;
      
      this.#worker = registration.active;
      this.ready = true;
      
      this.#setupMessageListener();
      
      this.#eventBus.emit('worker:ready', { worker: this.#worker });
      
      return registration;
    } catch (error) {
      this.#eventBus.emit('worker:error', { error });
      throw error;
    }
  }

  send(command) {
    if (!this.#worker) {
      console.warn('Service Worker not ready');
      return false;
    }

    try {
      this.#worker.postMessage(command.toJSON());
      return true;
    } catch (error) {
      this.#eventBus.emit('worker:error', { error });
      return false;
    }
  }

  onMessage(type, handler) {
    if (!this.#messageHandlers.has(type)) {
      this.#messageHandlers.set(type, new Set());
    }
    this.#messageHandlers.get(type).add(handler);
  }

  offMessage(type, handler) {
    const handlers = this.#messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  #setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, ...data } = event.data;
      
      this.#eventBus.emit(`worker:${type}`, data);
      
      const handlers = this.#messageHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(data, event);
          } catch (error) {
            console.error(`Error in message handler for ${type}:`, error);
          }
        });
      }
    });
  }

  getEventBus() {
    return this.#eventBus;
  }
}
