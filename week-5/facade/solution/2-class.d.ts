declare class TimeoutCollection<K = any, V = any> {
  constructor(timeout: number, arrayData?: [K, V][]);
  
  readonly timeout: number;
  readonly size: number;
  
  set(key: K, value: V): this;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  
  keys(): IterableIterator<K>;
  values(): IterableIterator<V>;
  entries(): IterableIterator<[K, V]>;
  forEach(callback: (value: V, key: K, map: TimeoutCollection<K, V>) => void, thisArg?: any): void;
  
  [Symbol.iterator](): IterableIterator<[K, V]>;
  
  toArray(): [K, V][];
}

export = TimeoutCollection;
