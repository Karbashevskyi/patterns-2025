"use strict";

export class TimerDelayError extends Error {
  constructor() {
    super("Timer delay must be a positive number");
    this.name = "TimerDelayError";
  }
}

export const TimeoutCollection = function (timeout, arrayData) {
  if (typeof timeout !== "number" || timeout <= 0) throw new TimerDelayError();
  this.timeout = timeout;
  this.collection = new Map();
  this.timers = new Map();

  if (Array.isArray(arrayData)) {
    for (const {0: key, 1: value} of arrayData) {
      this.set(key, value);
    }
  }
};

TimeoutCollection.prototype.set = function (key, value) {
  const timer = this.timers.get(key);
  if (timer) clearTimeout(timer);
  const timeout = setTimeout(() => {
    this.delete(key);
  }, this.timeout);

  if (typeof timeout?.unref === "function") {
    // Usefull in Node.js to prevent the timer from keeping the event loop alive when there are no other active timers.
    timeout.unref();
  }

  this.collection.set(key, value);
  this.timers.set(key, timeout);
  return this;
};

TimeoutCollection.prototype.get = function (key) {
  return this.collection.get(key);
};

TimeoutCollection.prototype.delete = function (key) {
  const timer = this.timers.get(key);
  if (timer) {
    clearTimeout(timer);
    this.collection.delete(key);
    this.timers.delete(key);
  }
};

TimeoutCollection.prototype.toArray = function () {
  return [...this.collection.entries()];
};

// Make it work in both CommonJS and ES modules environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = TimeoutCollection;
}

// Make it work in browser environments
if (typeof window !== "undefined") {
  window.TimeoutCollection = TimeoutCollection;
}

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
