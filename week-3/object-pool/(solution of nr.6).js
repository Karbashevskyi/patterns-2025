"use strict";

class Pool {

  constructor({ factory, size, max }) {
    this.factory = factory;
    this.max = max;
    this.currentSize = size;
    this.instances = Array.from({ length: size }, this.factory);
    this.queue = [];
  }

  acquire() {
    return new Promise((resolve) => {
      let instance = this.instances.pop();
      if (!instance && this.#canCreateMore()) instance = this.#createInstance();

      if (instance) resolver(instance);
      else this.queue.push(resolve);
    });
  }

  release(instance) {
    const resolve = this.queue.shift();
    if (resolve) resolver(instance);
    else if (
      this.instances.length < this.max &&
      !this.instances.includes(instance)
    ) {
      this.instances.push(instance);
    }
  }

  #canCreateMore() {
    return this.currentSize < this.max;
  }

  #createInstance() {
    const instance = this.factory();
    this.currentSize++;
    return instance;
  }
}

// Usage
const createBuffer = (size) => new Uint8Array(size);
const FILE_BUFFER_SIZE = 4096;
const createFileBuffer = () => createBuffer(FILE_BUFFER_SIZE);
const pool = new Pool({ factory: createFileBuffer, size: 10, max: 15 });
pool.acquire().then((instance) => {
  console.log({ instance });
  pool.release(instance);
});
