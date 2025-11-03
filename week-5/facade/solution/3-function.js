"use strict";

export class TimerDelayError extends Error {
  constructor() {
    super("Timer delay must be a positive number");
    this.name = "TimerDelayError";
  }
}

export const timeoutCollection = (interval, arrayData) => {
  if (typeof interval !== "number" || interval <= 0) throw new TimerDelayError();
  const collection = new Map();
  const timers = new Map();

  const methods = {
    set(key, value) {
      const timer = timers.get(key);
      if (timer) clearTimeout(timer);
      const timeout = setTimeout(() => {
        collection.delete(key);
        timers.delete(key);
      }, interval);

      if (typeof timeout.unref === "function") {
        timeout.unref();
      }

      collection.set(key, value);
      timers.set(key, timeout);
      return this;
    },

    get(key) {
      return collection.get(key);
    },

    has(key) {
      return collection.has(key);
    },

    delete(key) {
      const timer = timers.get(key);
      if (timer) {
        clearTimeout(timer);
        collection.delete(key);
        timers.delete(key);
        return true;
      }
      return false;
    },

    clear() {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      collection.clear();
      timers.clear();
    },

    get size() {
      return collection.size;
    },

    keys() {
      return collection.keys();
    },

    values() {
      return collection.values();
    },

    entries() {
      return collection.entries();
    },

    forEach(callback, thisArg) {
      return collection.forEach(callback, thisArg);
    },

    [Symbol.iterator]() {
      return collection[Symbol.iterator]();
    },

    toArray() {
      return [...collection.entries()];
    },
  };

  if (Array.isArray(arrayData)) {
    for (const {0: key, 1: value} of arrayData) {
      methods.set(key, value);
    }
  }

  return methods;
};

module.exports = timeoutCollection;

// Usage

const hash = timeoutCollection(1000);
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