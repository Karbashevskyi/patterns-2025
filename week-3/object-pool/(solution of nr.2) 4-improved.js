'use strict';

class Pool {

  #errors = [];

  constructor(factory, { size, max }) {
    this.factory = factory;
    this.max = max;
    this.currentSize = size;
    this.instances = new Array(size).fill(null).map(factory);
  }

  hasErrors() {
    return this.#errors.length > 0;
  }

  getErrors() {
    return [...this.#errors];
  }

  acquire() {
    try {
      let instance = this.instances.pop();
      if (!instance && this.#canCreateMore()) {
        instance = this.factory();
        this.currentSize++;
      }
      return instance;
    } catch (error) {
      this.#errors.push(error);
      return null;
    }
  }

  release(instance) {
    const instanceCanBeReturned = this.instances.length < this.max && !this.instances.includes(instance);
    if (instanceCanBeReturned) {
      this.instances.push(instance);
    }
    return instanceCanBeReturned;
  }

  #canCreateMore = () => this.currentSize < this.max;
}

// Usage

const createBuffer = (size) => new Uint8Array(size);
const FILE_BUFFER_SIZE = 4096;
const createFileBuffer = () => createBuffer(FILE_BUFFER_SIZE);

const pool = new Pool(createFileBuffer, { size: 10, max: 15 });
const instance = pool.acquire();
console.log({ instance });
pool.release(instance);