export class NetworkMonitor {
  #eventBus;
  #online;

  constructor(eventBus) {
    this.#eventBus = eventBus;
    this.#online = navigator.onLine;
    this.#setupListeners();
  }

  #setupListeners() {
    window.addEventListener('online', () => {
      this.#online = true;
      this.#eventBus.emit('network:online');
    });

    window.addEventListener('offline', () => {
      this.#online = false;
      this.#eventBus.emit('network:offline');
    });
  }

  isOnline() {
    return this.#online;
  }

  isOffline() {
    return !this.#online;
  }
}
