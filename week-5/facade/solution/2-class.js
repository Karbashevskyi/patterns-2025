"use strict";

export class TimerDelayError extends Error {
  constructor() {
    super("Timer delay must be a positive number");
    this.name = "TimerDelayError";
  }
}

export class TimeoutCollection {
  constructor(timeout, ...arrayData) {
    if (typeof timeout !== "number" || timeout <= 0)
      throw new TimerDelayError();
    this.timeout = timeout;
    this.collection = new Map();
    this.timers = new Map();

    if (Array.isArray(arrayData)) {
      for (const { 0: key, 1: value } of arrayData) {
        this.set(key, value);
      }
    }
  }

  set(key, value) {
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    const timeout = setTimeout(() => {
      this.delete(key);
    }, this.timeout);

    if (typeof timeout.unref === "function") {
      timeout.unref();
    }

    this.collection.set(key, value);
    this.timers.set(key, timeout);
    return this;
  }

  get(key) {
    return this.collection.get(key);
  }

  has(key) {
    return this.collection.has(key);
  }

  delete(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.collection.delete(key);
      this.timers.delete(key);
      return true;
    }
    return false;
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.collection.clear();
    this.timers.clear();
  }

  get size() {
    return this.collection.size;
  }

  keys() {
    return this.collection.keys();
  }

  values() {
    return this.collection.values();
  }

  entries() {
    return this.collection.entries();
  }

  forEach(callback, thisArg) {
    return this.collection.forEach(callback, thisArg);
  }

  [Symbol.iterator]() {
    return this.collection[Symbol.iterator]();
  }

  toArray() {
    return [...this.collection.entries()];
  }
}

module.exports = TimeoutCollection;

// Usage
const hash = new TimeoutCollection(1000);
hash.set("uno", 1);
console.dir({ array: hash.toArray() });

hash.set("due", 2);
console.dir({ array: hash.toArray() });

setTimeout(() => {
  hash.set("tre", 3);
  console.dir({ array: hash.toArray() });

  setTimeout(() => {
    hash.set("quattro", 4);
    console.dir({ array: hash.toArray() });
  }, 500);
}, 1500);
