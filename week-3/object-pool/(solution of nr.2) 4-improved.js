'use strict';

class Pool {
  constructor(factory, { size, max }) {
    this.factory = factory;
    this.max = max;
    this.instances = new Array(size).fill(null).map(factory);
  }

  acquire() {
    return this.instances.pop() || this.factory();
  }

  release(instance) {
    if (this.instances.length < this.max) {
      this.instances.push(instance);
    }
  }
}

// Usage

const createBuffer = (size) => new Uint8Array(size);
const FILE_BUFFER_SIZE = 4096;
const createFileBuffer = () => createBuffer(FILE_BUFFER_SIZE);

const pool = new Pool(createFileBuffer, { size: 10, max: 15 });
const instance = pool.acquire();
console.log({ instance });
pool.release(instance);