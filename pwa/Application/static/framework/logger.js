export class Logger {
  #output;
  #formatters = new Map();

  constructor(outputId, options = {}) {
    this.#output = document.getElementById(outputId);
    this.timestamps = options.timestamps ?? true;
    this.maxLines = options.maxLines ?? 1000;
    
    this.registerFormatter('object', (x) => JSON.stringify(x, null, 2));
    this.registerFormatter('default', (x) => String(x));
  }

  registerFormatter(type, formatter) {
    this.#formatters.set(type, formatter);
  }

  log(...args) {
    if (!this.#output) return;

    const lines = args.map((arg) => this.#serialize(arg));
    const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : '';
    const logEntry = `${timestamp}${lines.join(' ')}\n`;
    
    this.#output.textContent += logEntry;
    this.#trimLines();
    this.#scrollToBottom();
  }

  info(...args) {
    this.log('[INFO]', ...args);
  }

  warn(...args) {
    this.log('[WARN]', ...args);
  }

  error(...args) {
    this.log('[ERROR]', ...args);
  }

  clear() {
    if (this.#output) {
      this.#output.textContent = '';
    }
  }

  getText() {
    return this.#output?.textContent || '';
  }

  #serialize(x) {
    if (x === null) return 'null';
    if (x === undefined) return 'undefined';
    
    const type = typeof x;
    const formatter = this.#formatters.get(type) || this.#formatters.get('default');
    return formatter(x);
  }

  #trimLines() {
    if (!this.maxLines || !this.#output) return;
    
    const lines = this.#output.textContent.split('\n');
    if (lines.length > this.maxLines) {
      this.#output.textContent = lines.slice(-this.maxLines).join('\n');
    }
  }

  #scrollToBottom() {
    if (this.#output) {
      this.#output.scrollTop = this.#output.scrollHeight;
    }
  }
}
