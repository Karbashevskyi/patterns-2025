export function createSharedPromise(asyncFunction, { once = false } = {}) {
  let inFlight = false;
  let cache = null;
  const fulfillRejectHandlers = [];

  const run = (argument, fulfillRejectFlag) => {
    if (once) {
      while (fulfillRejectHandlers.length) {
        const { [fulfillRejectFlag]: handler } = fulfillRejectHandlers.pop();
        handler?.(argument);
      }
    } else {
      fulfillRejectHandlers.forEach(
        ({ [fulfillRejectFlag]: handler }) => handler?.(argument)
      );
    }
  };

  return {
    clear() {
      cache = null;
    },
    then(onFulfilled, onRejected) {
      if (cache !== null) {
        onFulfilled?.(cache);
        return;
      }

      fulfillRejectHandlers.push([onFulfilled, onRejected]);

      if (inFlight) return;
      inFlight = true;

      asyncFunction()
        .then(result => {
          cache = result;
          inFlight = false;
          run(result, 0);
        })
        .catch(error => run(error, 1));
    }
  };
}