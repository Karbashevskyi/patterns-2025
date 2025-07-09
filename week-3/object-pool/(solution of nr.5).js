"use strict";

const poolify = ({ factory, size, max }) => {
  const instances = Array.from({ length: size }, factory);
  const queue = [];
  let currentSize = size;
  const errors = [];

  const acquire = () =>
    new Promise((resolve) => {
      let instance = instances.pop();

      if (!instance && canCreateMore()) instance = createInstance();

      if (instance) resolve(instance);
      else queue.push(resolve);
    });

  const release = (instance) => {
    if (queue.length) queue.shift()(instance);
    else if (instances.length < max && !instances.includes(instance))
      instances.push(instance);
  };

  const canCreateMore = () => currentSize < max;
  const createInstance = () => {
    if (!canCreateMore()) return null;
    currentSize++;
    return factory();
  };

  return { acquire, release };
};

// Usage
const createBuffer = (size) => new Uint8Array(size);
const FILE_BUFFER_SIZE = 4096;
const createFileBuffer = () => createBuffer(FILE_BUFFER_SIZE);

const pool = poolify({ factory: createFileBuffer, size: 10, max: 15 });
pool.acquire().then((instance) => {
  console.log({ instance });
  pool.release(instance);
});
