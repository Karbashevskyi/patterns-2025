export class Command {
  constructor(type, payload = {}) {
    this.type = type;
    this.payload = payload;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      ...this.payload,
      timestamp: this.timestamp,
    };
  }
}

export class ConnectCommand extends Command {
  constructor(clientId) {
    super('connect', { clientId });
  }
}

export class DisconnectCommand extends Command {
  constructor() {
    super('disconnect');
  }
}

export class MessageCommand extends Command {
  constructor(content) {
    super('message', { content });
  }
}

export class UpdateCacheCommand extends Command {
  constructor() {
    super('updateCache');
  }
}

export class PingCommand extends Command {
  constructor() {
    super('ping');
  }
}

export class NetworkStatusCommand extends Command {
  constructor(online) {
    super(online ? 'online' : 'offline');
  }
}

export class CommandFactory {
  static connect(clientId) {
    return new ConnectCommand(clientId);
  }

  static disconnect() {
    return new DisconnectCommand();
  }

  static message(content) {
    return new MessageCommand(content);
  }

  static updateCache() {
    return new UpdateCacheCommand();
  }

  static ping() {
    return new PingCommand();
  }

  static networkStatus(online) {
    return new NetworkStatusCommand(online);
  }
}
