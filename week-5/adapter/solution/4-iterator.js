'use strict';

export class TimerDelayError extends Error {
  constructor() {
    super('Timer delay must be a positive number');
    this.name = 'TimerDelayError';
  }
}

class Timer {
  #counter = 0;
  #resolvers = new Set();
  #setIntervalId = null;
  #delay = null;
  #isPaused = false;
  #isStopped = false;
  #isRunning = false;

  constructor(delay) {
    this.#delay = delay;
    this.start(delay);
  }

  start(delay = this.#delay) {
    if (this.#isRunning) return false;
    if (typeof delay !== 'number' || delay <= 0) throw new TimerDelayError();
    this.#isRunning = true;
    this.#isPaused = false;
    this.#isStopped = false;
    this.#setIntervalId = setInterval(() => {
      this.#counter++;
      for (const resolve of this.#resolvers) {
        resolve({
          value: this.#counter,
          done: false,
        });
      }
      this.#resolvers.clear();
    }, delay);
    return true;
  }

  pause() {
    if (this.#isPaused) return true;
    if (this.#setIntervalId && this.#isRunning) {
      clearInterval(this.#setIntervalId);
      this.#setIntervalId = null;
      this.#isPaused = true;
      this.#isRunning = false;
      this.#isStopped = false;
      return true;
    }
    return false;
  }

  stop() {
    if (this.#isStopped) return true;
    const result = this.pause();
    if (result) {
      this.#counter = 0;
      this.#resolvers.clear();
      this.#isRunning = false;
      this.#isPaused = false;
      this.#isStopped = true;
    }
    return result;
  }

  [Symbol.asyncIterator]() {
    const next = () => new Promise((resolve) => {
      this.#resolvers.add(resolve);
    });
    const iterator = { next };
    return iterator;
  }
}

// Usage

const main = async () => {
  const timer = new Timer(1000);

  (async () => {
    console.log('Section 1 start');
    for await (const step of timer) {
      console.log({ section: 1, step });
      if (step >= 10) break; // Prevent infinite loop for demo
    }
  })();

  (async () => {
    console.log('Section 2 start');
    const iter = timer[Symbol.asyncIterator]();
    let count = 0;
    do {
      const { value, done } = await iter.next();
      console.log({ section: 2, step: value, done });
      count++;
      if (count >= 10) break; // Prevent infinite loop for demo
    } while (true);
  })();

  (async () => {
    console.log('Section 3 start');
    const iter = timer[Symbol.asyncIterator]();
    let count = 0;
    do {
      const { value, done } = await iter.next();
      console.log({ section: 3, step: value, done });
      count++;
      if (count >= 10) break; // Prevent infinite loop for demo
    } while (true);
  })();

  // Example of pausing the timer
  setTimeout(() => {
    console.log('Pausing timer after 5 seconds');
    timer.pause();
  }, 5000);

  // Example of restarting the timer
  setTimeout(() => {
    console.log('Restarting timer after 7 seconds');
    timer.start(1000);
  }, 7000);
};

main();
