export class InstallManager {
  #eventBus;
  #prompt = null;

  constructor(eventBus) {
    this.#eventBus = eventBus;
    this.#setupListeners();
  }

  #setupListeners() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.#prompt = event;
      this.#eventBus.emit('install:available');
    });

    // Коли додаток встановлено
    window.addEventListener('appinstalled', () => {
      this.#prompt = null;
      this.#eventBus.emit('install:completed');
    });
  }

  isAvailable() {
    return this.#prompt !== null;
  }

  async install() {
    if (!this.#prompt) {
      throw new Error('Install prompt not available');
    }

    this.#prompt.prompt();
    const { outcome } = await this.#prompt.userChoice;
    
    this.#eventBus.emit('install:choice', { outcome });
    
    if (outcome === 'dismissed') {
      this.#prompt = null;
    }

    return outcome;
  }
}
