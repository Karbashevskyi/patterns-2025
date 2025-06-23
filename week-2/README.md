# Week 2: Async Iterator & Basket Pattern

This week focuses on implementing an asynchronous iterator for a purchase dataset and a Basket class that collects items up to a specified limit. The Basket notifies the user with the final list, total, and any errors after iteration.

## Task Overview
- Implement an async iterator for a list of purchases.
- Use the iterator to add items to a Basket.
- The Basket enforces a spending limit and collects errors if the limit is exceeded.
- After iteration, the Basket provides a thenable/final callback with the results.

## Solutions

### solution.v1.ts
- Defines a `PurchaseIterator` that yields objects with `{ item, hasMore }`.
- The `Basket` class accepts these objects, tracks items, total, and errors, and calls a callback when done.
- Uses a callback for completion notification.

### solution.v2.ts
- Defines a `PurchaseIterator` that yields `IPurchase` items directly (no `hasMore`).
- The `Basket` class is thenable (implements `then`), so you can `await` it for results.
- Uses a callback and also supports `await` for completion notification.

## How to Run

From the project root, use the following npm scripts:

```sh
# Run solution v1
npm run week-2:solution:v1

# Run solution v2
npm run week-2:solution:v2
```

## Example Output
```
# For v1: prints the total after adding items within the limit
# For v2: prints 'Total: <number>' after processing
```

## Notes
- Both solutions demonstrate async iteration and error handling.
- v2 uses a more modern thenable/Promise-like approach for the Basket.
- The purchase limit is set to 1050 in both examples.
