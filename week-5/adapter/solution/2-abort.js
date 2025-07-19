'use strict';

class PromisifyAbortError extends Error {
  constructor() {
    super("Promisify operation was aborted");
    this.name = "PromisifyAbortError";
  }
}

const promisify = (fn) => (...args) =>  new Promise((resolve, reject) => {
      let completed = false;
      const lastArgRef = args.at(-1);
      const hasSignal = typeof lastArgRef === 'object' && lastArgRef !== null && 'signal' in lastArgRef;
      
      let callback = (err, data) => {
        if (completed) return;
        completed = true;
        if (err) reject(err);
        else resolve(data);
      };
      
      if (!hasSignal) {
        fn(...args, callback);
        return;
      }

      const options = args.pop();
      const { signal } = options;
      
      if (signal.aborted) {
        reject(new PromisifyAbortError());
        return;
      }
      
      const abortHandler = () => {
        if (completed) return;
        completed = true;
        reject(new PromisifyAbortError());
      };
      
      signal.addEventListener('abort', abortHandler, { once: true });
      
      fn(...args, (err, data) => {
        signal.removeEventListener('abort', abortHandler);
        callback(err, data);
      });

    });

// Usage

import fs from 'node:fs';
const read = promisify(fs.readFile);

const main = async () => {
  try {
    // Test with AbortController
    const controller = new AbortController();
    const fileName = '2-abort.js';
    
    // Cancel after 1 millisecond to get an abort error
    setTimeout(() => {
      console.log('Aborting operation...');
      controller.abort();
    }, 1);
    
    console.log('Reading file with abort signal...');
    const data = await read(fileName, 'utf8', { signal: controller.signal });
    console.log(`File "${fileName}" size: ${data.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  try {
    // Test normal operation without abort
    console.log('Reading file without abort signal...');
    const fileName = '2-abort.js';
    const data = await read(fileName, 'utf8');
    console.log(`File "${fileName}" size: ${data.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

main();
