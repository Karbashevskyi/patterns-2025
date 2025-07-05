'use strict';

const poolify = ({ factory, factoryArguments = [], size, max }) => {
  const pool = Array.from({ length: size }, () => factory(...factoryArguments));
  let currentSize = size;

  const acquire = () => {
    if (pool.length > 0) {
      return pool.pop();
    }
    if (currentSize < max) {
      currentSize++;
      return factory(...factoryArguments);
    }
    throw new Error('No available instances');
  };

  const release = (instance) => {
    const status = pool.length < max && !pool.includes(instance);
    if (status) {
      pool.push(instance);
    }
    return status;
  };

  return { acquire, release };
};


// Usage

const FILE_BUFFER_SIZE = 4096;
const createBuffer = (FILE_BUFFER_SIZE) => new Uint8Array(FILE_BUFFER_SIZE);

const pool = poolify({ 
    factory: createBuffer, 
    factoryArguments: [FILE_BUFFER_SIZE], 
    size: 10, 
    max: 15, 
});

const buf = pool.acquire();
console.log({ buf });

pool.release(buf);