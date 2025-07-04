import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import { FileStorage } from '../3-file-storage.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function test(description, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`✅  ${description}`))
    .catch(err => {
      console.error(`❌  ${description}`);
      console.error(err);
      process.exitCode = 1;
    });
}

function streamFromRecords(records) {
  const payload = records.map(r => JSON.stringify(r)).join('\n');
  return Readable.from(payload);
}

const sample = [
  { "city": "Kiyv", "name": "Glushkov" },
  { "city": "Roma", "name": "Marcus Aurelius" },
  { "city": "Shaoshan", "name": "Mao Zedong" },
  { "city": "Roma", "name": "Lucius Verus" },
];

const originalCreateReadStream = fs.createReadStream;
fs.createReadStream = () => streamFromRecords(sample);

test('select() returns matching records', async () => {
  const db = new FileStorage('storage.dat', { filePath: __dirname + '/../../' });
  const out = [];
  for await (const rec of db.select({ city: 'Roma' })) {
    out.push(rec);
  }
  assert.deepEqual(out, [sample[1], sample[3]]);
});

test('select() yields done=true when no match', async () => {
  const db = new FileStorage('storage.dat', { filePath: __dirname + '/../../' });
  const it = db.select({ city: 'Odessa' })[Symbol.asyncIterator]();
  const first = await it.next();
  assert.equal(first.done, true);
});

test('select() honours multiple field predicates', async () => {
  const db = new FileStorage('storage.dat', { filePath: __dirname + '/../../' });
  fs.createReadStream = () => streamFromRecords(sample);
  const extra = sample[2];
  const result = [];
  for await (const rec of db.select({ city: 'Shaoshan', name: 'Mao Zedong' })) {
    result.push(rec);
  }
  assert.deepEqual(result, [extra]);
});

Promise.resolve().then(() => {
  fs.createReadStream = originalCreateReadStream;
});