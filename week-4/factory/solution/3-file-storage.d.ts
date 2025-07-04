export type Query<T> = {
  [K in keyof T]?: T[K];
};

export abstract class Database {
    select<T = any>(query?: Query<T>): AsyncIterable<T>;
}

export abstract class Cursor<T = any> implements AsyncIterable<T> {
    readonly current: number;
    [Symbol.asyncIterator](): AsyncIterator<T>;
}

export class FileLineCursor<T = any> extends Cursor<T> {}

export class FileStorage extends Database {
  constructor(fileName: string);
}

export default FileStorage;