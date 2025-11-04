import { IStorage } from './storage-interface.js';

export class OPFSStorage extends IStorage {
  constructor(name) {
    super();
    this.name = name;
    this.directoryHandle = null;
    this.isInitialized = false;
  }

  async ensureInitialized() {
    if (this.isInitialized) return;

    try {
      const root = await navigator.storage.getDirectory();
      
      this.directoryHandle = await root.getDirectoryHandle(this.name, { create: true });
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize OPFS storage: ${error.message}`);
    }
  }

  async #getFileHandle(id, create = false) {
    await this.ensureInitialized();
    const filename = `${id}.json`;
    
    try {
      return await this.directoryHandle.getFileHandle(filename, { create });
    } catch (error) {
      if (error.name === 'NotFoundError') return null;
      throw error;
    }
  }

  async #readFile(fileHandle) {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  }

  async #writeFile(fileHandle, data) {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  async #getAllFileHandles() {
    await this.ensureInitialized();
    const handles = [];
    
    for await (const [name, handle] of this.directoryHandle.entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        handles.push(handle);
      }
    }
    
    return handles;
  }

  async create(record) {
    if (!record.id) throw new Error('Record must have an id');

    const fileHandle = await this.#getFileHandle(record.id, false);
    if (fileHandle) throw new Error(`Record with id '${record.id}' already exists`);

    const newFileHandle = await this.#getFileHandle(record.id, true);
    await this.#writeFile(newFileHandle, record);
    
    return record.id;
  }

  async read(id) {
    const fileHandle = await this.#getFileHandle(id, false);
    if (!fileHandle) return null;

    return await this.#readFile(fileHandle);
  }

  async readAll() {
    const fileHandles = await this.#getAllFileHandles();
    const records = [];

    for (const fileHandle of fileHandles) {
      const record = await this.#readFile(fileHandle);
      records.push(record);
    }

    return records;
  }

  async update(id, updates) {
    const fileHandle = await this.#getFileHandle(id, false);
    if (!fileHandle) throw new Error(`Record with id '${id}' not found`);

    const record = await this.#readFile(fileHandle);
    const updatedRecord = { ...record, ...updates, id }; // Ensure id is not changed
    
    await this.#writeFile(fileHandle, updatedRecord);
    
    return updatedRecord;
  }

  async delete(id) {
    await this.ensureInitialized();
    
    try {
      await this.directoryHandle.removeEntry(`${id}.json`);
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') return false;
      throw error;
    }
  }

  async deleteAll() {
    const fileHandles = await this.#getAllFileHandles();
    let count = 0;

    for (const fileHandle of fileHandles) {
      try {
        await this.directoryHandle.removeEntry(fileHandle.name);
        count++;
      } catch (error) {
        console.error(`Failed to delete ${fileHandle.name}:`, error);
      }
    }

    return count;
  }

  async exists(id) {
    const fileHandle = await this.#getFileHandle(id, false);
    return fileHandle !== null;
  }

  async count() {
    const fileHandles = await this.#getAllFileHandles();
    return fileHandles.length;
  }

  getName() {
    return this.name;
  }

  getType() {
    return 'opfs';
  }

  async close() {
    this.directoryHandle = null;
    this.isInitialized = false;
  }
}

export async function createOPFSStorage(name) {
  const storage = new OPFSStorage(name);
  await storage.ensureInitialized();
  return storage;
}
