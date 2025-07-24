import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import FSInt  from '../3-file-storage.js';

const { mkdtempSync, writeFileSync, existsSync, rmSync } = fs;
const { join } = path;

const tests = [];
function intTest(desc, fn) {
  tests.push({ desc, fn });
}

const tmpDir = mkdtempSync(join(os.tmpdir(), 'file-storage-'));
const tmpFile = join(tmpDir, 'storage.dat');

const records = [
  { id: 1, city: 'Kyiv' },
  { id: 2, city: 'Roma' },
  { id: 3, city: 'Madrid' },
];
writeFileSync(tmpFile, records.map(r => JSON.stringify(r)).join('\n'));

intTest('integration: data file exists', () => {
  assert.ok(existsSync(tmpFile));
});

intTest('integration: select() fetches correct record', async () => {
  const db = new FSInt(tmpFile);
  const cursor = db.select({ city: 'Roma' });
  const first = (await cursor[Symbol.asyncIterator]().next()).value;
  assert.deepEqual(first, records[1]);
});

intTest('integration: iterate full cursor', async () => {
  const db = new FSInt(tmpFile);
  const out = [];
  for await (const rec of db.select({})) {
    out.push(rec);
  }
  assert.deepEqual(out, records);
});

intTest('integration: cleanup tmp dir', () => {
  rmSync(tmpDir, { recursive: true, force: true });
  assert.ok(!existsSync(tmpDir));
});

(async () => {
  for (const { desc, fn } of tests) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
        console.log(`✅ ${desc}`);
      } else {
        console.log(`✅ ${desc}`);
      }
    } catch (err) {
      console.error(`❌ ${desc}`);
      console.error(err);
    }
  }
})();