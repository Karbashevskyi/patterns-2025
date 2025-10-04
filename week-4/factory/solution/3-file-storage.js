import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";

class Database {
  constructor() {
    if (new.target === Database) {
      throw new Error(
        "Database is an abstract class and cannot be instantiated directly."
      );
    }
  }

  select(query = {}) {
    throw new Error("select() must be implemented by subclass");
  }
}

class Cursor {
  current = 0;

  constructor() {
    if (new.target === Cursor) {
      throw new Error(
        "Cursor is an abstract class and cannot be instantiated directly."
      );
    }
  }

  [Symbol.asyncIterator]() {
    throw new Error("[Symbol.asyncIterator] must be implemented by subclass");
  }
}

class FileLineCursor extends Cursor {
  constructor(fileStorage, query = {}) {
    super();
    this.query = query;
    this.linesIterator = readline
      .createInterface({
        input: fileStorage.fileStream,
        crlfDelay: Infinity,
      })
      [Symbol.asyncIterator]();
  }

  [Symbol.asyncIterator]() {
    const cursor = this;
    return {
      async next() {
        while (true) {
          const { value, done } = await cursor.linesIterator.next();
          if (done) return { done: true };

          cursor.current++;
          const record = JSON.parse(value);
          let matches = true;
          for (const [field, expected] of Object.entries(cursor.query)) {
            matches = matches && record[field] === expected;
          }
          if (matches) {
            return { value: record, done: false };
          }
        }
      },
    };
  }
}

class FileStorage extends Database {
  constructor(fileName, options = { filePath: "./", skipFileCheck: false }) {
    super();
    if (!options.skipFileCheck) {
      this.checkIfFileExists(fileName, options.filePath);
    }
    this.fileName = fileName;
    this.options = options;
    this.fileStream = fs.createReadStream(this.path(), { encoding: "utf8" });
  }

  path() {
    return path.resolve(this.options.filePath, this.fileName);
  }

  select(query = {}) {
    return new FileLineCursor(this, query);
  }

  checkIfFileExists(fileName, filePath = "./") {
    try {
      const fullPath = path.resolve(filePath, fileName);
      fs.accessSync(fullPath);
    } catch (err) {
      throw new Error(`File not found: ${fullPath}`);
    }
  }
}

export default FileStorage;
