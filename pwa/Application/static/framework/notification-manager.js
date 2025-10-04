export class NotificationManager {
  #eventBus;
  #permission = null;

  constructor(eventBus) {
    this.#eventBus = eventBus;
    this.#permission = Notification.permission;
  }

  async requestPermission() {
    if (this.#permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    this.#permission = permission;
    
    this.#eventBus.emit('notification:permission', { permission });
    
    return permission === 'granted';
  }

  hasPermission() {
    return this.#permission === 'granted';
  }

  isPageVisible() {
    return !document.hidden;
  }

  showIfHidden(title, options = {}) {
    if (this.isPageVisible()) return null;
    return this.show(title, options);
  }

  show(title, options = {}) {
    if (!this.hasPermission()) {
      console.warn('Notification permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      this.#eventBus.emit('notification:clicked', { title });
    };

    return notification;
  }
}
