'use strict';

export const timeoutCollection = (interval) => {
  const collection = new Map();
  const expirationTimes = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const {0: key, 1: expireTime} of expirationTimes.entries()) {
      if (now >= expireTime) {
        collection.delete(key);
        expirationTimes.delete(key);
      }
    }
  };

  return {
    set(key, value) {
      const expireTime = Date.now() + interval;
      collection.set(key, value);
      expirationTimes.set(key, expireTime);
      return this;
    },

    get(key) {
      const expireTime = expirationTimes.get(key);
      if (expireTime && Date.now() >= expireTime) {
        collection.delete(key);
        expirationTimes.delete(key);
        return undefined;
      }
      return collection.get(key);
    },

    has(key) {
      const expireTime = expirationTimes.get(key);
      if (expireTime && Date.now() >= expireTime) {
        collection.delete(key);
        expirationTimes.delete(key);
        return false;
      }
      return collection.has(key);
    },

    delete(key) {
      const existed = collection.has(key);
      collection.delete(key);
      expirationTimes.delete(key);
      return existed;
    },

    clear() {
      collection.clear();
      expirationTimes.clear();
    },

    get size() {
      cleanup();
      return collection.size;
    },

    keys() {
      cleanup(); 
      return collection.keys();
    },

    values() {
      cleanup(); 
      return collection.values();
    },

    entries() {
      cleanup();
      return collection.entries();
    },

    forEach(callback, thisArg) {
      cleanup();
      return collection.forEach(callback, thisArg);
    },

    [Symbol.iterator]() {
      cleanup();
      return collection[Symbol.iterator]();
    },

    toArray() {
      cleanup();
      return [...collection.entries()];
    }
  };
};

module.exports = timeoutCollection;

// Usage

const hash = timeoutCollection(1000);
hash.set('uno', 1);
console.dir({ array: hash.toArray() });

hash.set('due', 2);
console.dir({ array: hash.toArray() });

setTimeout(() => {
hash.set('tre', 3);
console.dir({ array: hash.toArray() });

setTimeout(() => {
    hash.set('quattro', 4);
    console.dir({ array: hash.toArray() });
}, 500);
}, 1500);