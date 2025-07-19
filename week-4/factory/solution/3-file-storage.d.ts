export type Query<T> = {
  [K in keyof T]?: T[K];
};

export abstract class Database {
    select<T = any>(query?: Query<T>): AsyncIterable<T>;
}

export class FileStorage extends Database {
  constructor(fileName: string);
}

export default FileStorage;