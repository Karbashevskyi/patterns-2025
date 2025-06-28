'use strict';

class Pool {
  constructor({ factory, size, max }) {
    this.factory = factory;
    this.max = max;
    this.instances = Array.from({ length: size }, this.factory);
    this.queue = [];
  }

  acquire(callback) {
    const instance = this.instances.pop();
    if (instance) {
      callback(instance);
    } else {
      this.queue.push(callback);
    }
  }

  release(instance) {
    if (this.queue.length > 0) {
      const cb = this.queue.shift();
      cb(instance);
    } else if (this.instances.length <= this.max) {
      this.instances.push(instance);
    }
  }
}

// Usage
const createBuffer = (size) => new Uint8Array(size);
const FILE_BUFFER_SIZE = 4096;
const createFileBuffer = () => createBuffer(FILE_BUFFER_SIZE);

const pool = new Pool({ factory: createFileBuffer, size: 10, max: 15 });
pool.acquire((instance) => {
  console.log({ instance });
  pool.release(instance);
});