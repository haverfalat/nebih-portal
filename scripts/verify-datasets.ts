import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { normalizeLabel } from '../src/parsers/fields.js';
import { NebihClient, datasets } from '../src/index.js';
import type { DatasetName } from '../src/index.js';

const saved = new Map<string, string>();
for (const file of await readdir('/tmp/nebih-audit').catch(() => []))
  saved.set(
    decodeURIComponent(file.replace(/\.html$/, '')),
    await readFile(`/tmp/nebih-audit/${file}`, 'utf8'),
  );
const fetcher: typeof fetch = async (input) => {
  const url = new URL(String(input));
  const html = saved.get(url.pathname);
  if (!html) return globalThis.fetch(input);
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
const client = new NebihClient({ fetch: fetcher, minIntervalMs: 0, cacheSize: 0 });
const results = [];
for (const name of Object.keys(datasets) as DatasetName[]) {
  const listing = await client.datasets.list(name);
  assert(listing.items.length > 0, `No records parsed for ${name}`);
  const columns = Object.keys(datasets[name].columns);
  const populated = columns.filter((column) =>
    listing.items.some((item) => item[column as keyof typeof item] !== null),
  );
  const recognized = Object.entries(datasets[name].columns).filter(([, column]) =>
    listing.items.some((item) =>
      item.fields.some((field) =>
        column.labels.some((label) => normalizeLabel(label) === normalizeLabel(field.label)),
      ),
    ),
  );
  assert.equal(recognized.length, columns.length, `Unrecognized headers in ${name}`);
  results.push({
    name,
    path: datasets[name].path,
    recordCount: listing.items.length,
    columns,
    populated,
  });
  console.log(
    name,
    listing.items.length,
    `${populated.length}/${columns.length} populated columns`,
  );
}
await writeFile(
  'data/dataset-verification.json',
  JSON.stringify({ checkedAt: new Date().toISOString(), datasets: results }, null, 2) + '\n',
);
