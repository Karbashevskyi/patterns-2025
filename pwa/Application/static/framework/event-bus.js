export class EventBus {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  once(event, callback) {
    const wrappedCallback = (...args) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    return this.on(event, wrappedCallback);
  }

  off(event, callback) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.#listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  clear() {
    this.#listeners.clear();
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.size || 0;
  }
}
