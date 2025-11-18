export class MessageManager {
  constructor() {
    this.websocket = null;
    this.connected = false;
    this.connecting = false;
    this.reconnectTimer = null;
    this.reconnectDelay = 3000;
  }

  async connect() {
    if (this.connected || this.connecting) return;
    
    this.connecting = true;

    const protocol = self.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${self.location.host}`;
    
    console.log('MessageManager: Connecting to:', url);
    this.websocket = new WebSocket(url);

    this.websocket.onopen = () => {
      this.connected = true;
      this.connecting = false;
      console.log('MessageManager: Connected');
      this.#broadcast({ type: 'status', connected: true });
    };

    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('MessageManager: Received message:', message);
      this.#broadcast(message);
    };

    this.websocket.onclose = (event) => {
      this.connected = false;
      this.connecting = false;
      
      const closeCodes = {
        1000: 'Normal closure',
        1001: 'Going away',
        1006: 'Abnormal closure (no close frame)',
        1015: 'TLS handshake failure'
      };
      
      const reason = closeCodes[event.code] || `Unknown (${event.code})`;
      console.log('MessageManager: Disconnected', {
        code: event.code,
        reason: reason,
        wasClean: event.wasClean
      });
      
      this.#broadcast({ 
        type: 'status', 
        connected: false,
        closeCode: event.code,
        closeReason: reason
      });
      
      // Reconnect only on abnormal closure
      if (event.code === 1006 || event.code === 1001) {
        this.#scheduleReconnect();
      }
    };

    this.websocket.onerror = (error) => {
      this.connecting = false;
      console.error('MessageManager: WebSocket error', {
        type: error.type,
        target: error.target?.readyState,
        url: url
      });
      
      this.#broadcast({ 
        type: 'error', 
        error: 'WebSocket connection failed',
        url: url
      });
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.connected = false;
    this.connecting = false;
  }

  send(packet) {
    if (!this.connected) {
      console.warn('MessageManager: Cannot send, not connected');
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(packet));
      return true;
    } catch (error) {
      console.error('MessageManager: Send failed:', error);
      return false;
    }
  }

  async #broadcast(packet, exclude = null) {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    console.log('MessageManager: Broadcasting to', clients.length, 'clients');
    
    for (const client of clients) {
      if (client !== exclude) {
        client.postMessage(packet);
      }
    }
  }

  #scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('MessageManager: Reconnecting...');
      this.connect();
    }, this.reconnectDelay);
  }
}
