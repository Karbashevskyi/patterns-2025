"use strict";

class Pool {
  #errors = [];

  constructor({ factory, size, max }) {
    this.factory = factory;
    this.max = max;
    this.currentSize = size;
    this.instances = Array.from({ length: size }, this.factory);
    this.queue = [];
  }

  hasErrors() {
    return this.#errors.length > 0;
  }

  getErrors() {
    return [...this.#errors];
  }

  acquire(callback) {
    let instance = this.instances.pop();
    if (!instance && this.#canCreateMore()) {
      instance = this.#createInstance();
    }

    if (instance) this.#executeCallback(callback, instance);
    else this.queue.push(callback);
  }

  release(instance) {
    const cb = this.queue.shift();
    if (cb) this.#executeCallback(cb, instance);
    else if (
      this.instances.length < this.max &&
      !this.instances.includes(instance)
    ) {
      this.instances.push(instance);
    }
  }

  #executeCallback(callback, instance) {
    try {
      callback(instance);
    } catch (error) {
      this.#errors.push(error);
      callback(null);
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
pool.acquire((instance) => {
  console.log({ instance });
  pool.release(instance);
});
