"use strict";

class PromisifyTimeoutError extends Error {
  constructor() {
    super("Promisify operation timed out");
    this.name = "PromisifyTimeoutError";
  }
}

const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
      let completed = false;
      let timeoutId = null;

      const callback = (err, data) => {
        if (completed) return;
        
        completed = true;
        
        if (timeoutId) clearTimeout(timeoutId);

        if (err) reject(err); else resolve(data);
      };

      const lastArgumentRef = args.at(-1);

      if (lastArgumentRef && lastArgumentRef?.timeout > 0) {
        const lastArgument = args.pop();

        timeoutId = setTimeout(() => {
          if (completed) return;

          completed = true;
          reject(new PromisifyTimeoutError());
        }, lastArgument.timeout);
      }

      fn(...args, callback);
    });

// Usage

import fs from "node:fs";
const read = promisify(fs.readFile);

const main = async () => {
  try {
    const fileName = "1-promisify.js";

    // Test with timeout
    console.log("Reading with timeout...");
    const data = await read(fileName, "utf8", { timeout: 5_000 });
    console.log(`File "${fileName}" size: ${data.length}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

main();
