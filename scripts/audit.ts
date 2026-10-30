import { mkdir, writeFile } from 'node:fs/promises';
import { NebihClient } from '../src/index.js';

const client = new NebihClient({ minIntervalMs: 250, cacheSize: 2, retries: 1 });
const links = await client.navigation.links();
const urls = [
  ...new Set(
    links
      .filter((link) => !link.external && new URL(link.url).protocol === 'https:')
      .map((link) => link.url),
  ),
];
await mkdir('/tmp/nebih-audit', { recursive: true });
const results: Array<Record<string, unknown>> = [];
for (let index = 0; index < urls.length; index++) {
  const url = urls[index]!;
  try {
    const source = await client.pages.source(url);
    await writeFile(
      `/tmp/nebih-audit/${encodeURIComponent(new URL(url).pathname)}.html`,
      source.html,
    );
    const page = await client.pages.get(url);
    results.push({
      url: page.url,
      title: page.title,
      fields: page.fields.map((field) => field.label),
      tables: page.tables.map((table) => ({
        id: table.id,
        headers: table.headers,
        rowCount: table.rows.length,
      })),
      forms: page.forms.map((form) => ({
        id: form.id,
        action: form.action,
        method: form.method,
        requiresCaptcha: form.requiresCaptcha,
        usesJavaScript: form.usesJavaScript,
        fields: form.fields
          .filter((field) => field.type !== 'hidden')
          .map((field) => ({
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.type,
          })),
      })),
      embeds: page.embeds,
      documentCount: page.documents.length,
      detailLinks: page.links
        .filter((link) => /\/l\/|\/-\//.test(new URL(link.url).pathname))
        .slice(0, 3),
      childLinks: page.links
        .filter(
          (link) =>
            !link.external &&
            !/\/(?:documents|o|c)\//.test(new URL(link.url).pathname) &&
            !new URL(link.url).search,
        )
        .slice(0, 30),
    });
    console.log(`${index + 1}/${urls.length} ${new URL(url).pathname}`);
  } catch (error) {
    results.push({ url, error: error instanceof Error ? error.message : String(error) });
    console.log(`${index + 1}/${urls.length} FAILED ${new URL(url).pathname}`);
  }
  await writeFile(
    'data/portal-audit.json',
    JSON.stringify(
      { checkedAt: new Date().toISOString(), source: client.transport.baseUrl, pages: results },
      null,
      2,
    ) + '\n',
  );
}
console.log(`Audited ${results.length} navigation URLs`);
