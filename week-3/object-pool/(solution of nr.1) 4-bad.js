'use strict';

const poolify = ({ factory, factoryArguments = [], size, max }) => {
  const createInstance = () => factory.apply(null, factoryArguments);
  const pool = Array.from({ length: size }, createInstance);
  let currentSize = size;
  const canCreateMoreInstances = () => currentSize < max;

  const acquire = () => {
    let instance = pool.pop();
    if (!instance && canCreateMoreInstances()) {
      currentSize++;
      instance = createInstance();
    }
    return instance;
  };

  const release = (instance) => {
    const instanceCanBeReturned = pool.length < max && !pool.includes(instance);
    if (instanceCanBeReturned) {
      pool.push(instance);
    }
    return instanceCanBeReturned;
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