'use strict';

class TimerEventNameError extends TypeError {
  constructor() {
    super('Event name must be a non-empty string');
    this.name = 'TimerEventNameError';
  }
}

class Timer extends EventTarget {
  #counter = 0;
  #eventName;
  #setIntervalId = null;

  constructor(delay, eventName = 'tick') {
    super();
    if (typeof eventName !== 'string' || !eventName) throw new TimerEventNameError();
    this.#eventName = eventName;
    this.#setIntervalId = setInterval(() => {
      const step = this.#counter++;
      const data = { detail: { step } };
      const event = new CustomEvent(this.#eventName, data);
      this.dispatchEvent(event);
    }, delay);
  }

  stop() {
    if (this.#setIntervalId) {
      clearInterval(this.#setIntervalId);
      this.#setIntervalId = null;
      return true;
    }
    return false;
  }
}

// Usage

const timer = new Timer(1000, 'step');

timer.addEventListener('step', (event) => {
  console.log({ event: event.type, detail: event.detail });
});

// Additional usage examples with diffent event names
const timerTick = new Timer(1500, 'tick');
timerTick.addEventListener('tick', (event) => {
  console.log({ timer: 'tick', event: event.type, detail: event.detail });
});

const timerPulse = new Timer(2000, 'pulse');
timerPulse.addEventListener('pulse', (event) => {
  console.log({ timer: 'pulse', event: event.type, detail: event.detail });
});
