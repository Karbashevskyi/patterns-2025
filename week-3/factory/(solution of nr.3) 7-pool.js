'use strict';

const POOL_SIZE = 1000;

const poolify = ({ factory, factoryOptions = {}, poolSize = POOL_SIZE }) => {
  const instances = Array.from({ length: poolSize }, () => factory(factoryOptions));

  const acquire = () => {
    const instance = instances.pop() || factory(factoryOptions);
    console.log('Get from pool, count =', instances.length);
    return instance;
  };

  const release = (instance) => {
    instances.push(instance);
    console.log('Recycle item, count =', instances.length);
  };

  return { acquire, release };
};

// Usage

const factory = ({ fill = 0 } = {}) => new Array(1000).fill(fill);
const arrayPool = poolify({ factory, factoryOptions: { fill: 0 }, poolSize: 100 });

const a1 = arrayPool.acquire();
const b1 = a1.map((x, i) => i).reduce((x, y) => x + y);
console.log(b1);