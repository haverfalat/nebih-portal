import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { NebihClient } from '../src/index.js';
import { createDom, contentRoot, extractLinks } from '../src/parsers/dom.js';

const client = new NebihClient({ minIntervalMs: 250, cacheSize: 2 });
const audit = JSON.parse(await readFile('data/portal-audit.json', 'utf8')) as {
  pages: Array<{ detailLinks?: Array<{ url: string }> }>;
};
const candidates = audit.pages.flatMap((page) => page.detailLinks ?? []).map((link) => link.url);
for (const category of ['food', 'veterinaryProducts'] as const) {
  const listing = await client.violations.list(category);
  for (const record of listing.items.slice(0, 3)) if (record.url) candidates.push(record.url);
}
for (const file of await readdir('/tmp/nebih-audit')) {
  const html = await readFile(`/tmp/nebih-audit/${file}`, 'utf8');
  const $ = createDom(html);
  const links = extractLinks($, contentRoot($), client.transport.baseUrl).filter((link) =>
    /\/l\//.test(new URL(link.url).pathname),
  );
  candidates.push(...links.map((link) => link.url));
}
const grouped = new Map<string, string[]>();
for (const url of candidates) {
  const path = new URL(url).pathname;
  const key = path.startsWith('/l/') ? path.split('/').slice(0, 3).join('/') : 'articles';
  const group = grouped.get(key) ?? [];
  if (!group.includes(url) && group.length < 3) group.push(url);
  grouped.set(key, group);
}
const results: Array<Record<string, unknown>> = [];
await mkdir('/tmp/nebih-detail-audit', { recursive: true });
for (const [template, urls] of grouped) {
  for (const url of urls) {
    try {
      const source = await client.pages.source(url);
      await writeFile(
        `/tmp/nebih-detail-audit/${encodeURIComponent(new URL(url).pathname)}.html`,
        source.html,
      );
      const page = await client.pages.get(url);
      results.push({
        template,
        url: page.url,
        fields: page.fields.map((field) => field.label),
        sections: page.sections.map((field) => field.label),
        tables: page.tables.map((table) => ({
          headers: table.headers,
          rowCount: table.rows.length,
        })),
        documents: page.documents.length,
        images: page.images.length,
      });
      console.log(template, url);
    } catch (error) {
      results.push({
        template,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await writeFile(
      'data/detail-audit.json',
      JSON.stringify(
        { checkedAt: new Date().toISOString(), samplesPerTemplate: 3, pages: results },
        null,
        2,
      ) + '\n',
    );
  }
}
const previous = (await readdir('/tmp')).filter((name) => /^nebih-detail-\d+\.html$/.test(name));
console.log(
  `Inspected ${results.length} template samples; ${previous.length} additional violation records were inspected separately`,
);
