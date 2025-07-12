"use strict";

const poolify = ({ factory, size, max }) => {
  const instances = Array.from({ length: size }, factory);
  const queue = [];
  const errors = [];
  const hasErrors = () => errors.length > 0;
  const getErrors = () => [...errors];
  const executeCallback = (callback, instance) => {
    try {
      callback(instance);
    } catch (error) {
      errors.push(error);
      callback(null);
    }
  };
  let currentSize = size;
  const canCreateMore = () => currentSize < max;
  const createInstance = () => {
    if (!canCreateMore()) return null;
    currentSize++;
    return factory();
  };

  const getInstance = () => instances.pop() || createInstance();

  const acquire = (callback) => {
    const instance = getInstance();
    instance ? executeCallback(callback, instance) : queue.push(callback);
  };

  const release = (instance) => {
    const callback = queue.shift();
    if (callback) executeCallback(callback, instance);
    else {
      const instanceCanBeReturned =
        instances.length < max && !instances.includes(instance);
      if (instanceCanBeReturned) instances.push(instance);
    }
  };

  return { acquire, release, hasErrors, getErrors };
};

// Example
const pool = poolify({ factory: () => new Uint8Array(4096), size: 2, max: 4 });
pool.acquire((instance) => {
  console.log("Got instance", instance);
  setTimeout(() => pool.release(instance), 1000);
});
