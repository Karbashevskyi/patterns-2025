'use strict';

const poolify = ({ factory, size, max }) => {
  const instances = Array.from({ length: size }, factory);
  const queue = [];
  let currentSize = size;

  const acquire = (callback) => {
    if (instances.length === 0 && currentSize < max) {
      instances.push(factory());
      currentSize++;
    }
    const instance = instances.pop();
    if (instance) {
      callback(instance);
    } else {
      queue.push(callback);
    }
  };

  const release = (instance) => {
    if (queue.length > 0) {
      const callback = queue.shift();
      callback(instance);
    } else if (instances.length < max) {
      instances.push(instance);
    }
  };

  return { acquire, release };
};

// Example
const pool = poolify({ factory: () => new Uint8Array(4096), size: 2, max: 4 });
pool.acquire((instance) => {
  console.log('Got instance', instance);
  setTimeout(() => pool.release(instance), 1000);
});