import assert from 'node:assert/strict';
import { NebihClient } from '../src/index.js';

const client = new NebihClient({ cacheTtlMs: 0 });
const news = await client.news.list();
assert(news.items.length > 0);
assert(news.items[0]?.publishedAt);
assert(news.pagination?.nextUrl);
console.log('news', news.items.length, news.pagination.currentPage);
const second = await client.news.list({ page: 2 });
assert.equal(second.pagination?.currentPage, 2);
assert.notEqual(second.items[0]?.url, news.items[0]?.url);
console.log('news page 2', second.items.length);
const recalls = await client.recalls.list();
assert(recalls.items.length > 0);
assert(recalls.items[0]?.url);
const detail = await client.recalls.get(recalls.items[0].url);
assert(detail.page.fields.length > 0);
console.log('recalls', recalls.items.length, 'detail fields', detail.page.fields.length);
const additives = await client.additives.list();
assert(additives.items.length > 100);
assert(additives.items[0]?.url);
console.log('additives', additives.items.length);
const results = await client.search.query('pisztácia');
assert(results.items.length > 0);
console.log('search', results.items.length);
const navigation = await client.navigation.tree();
assert(navigation.some((item) => item.children.length));
console.log('navigation sections', navigation.length);
const sitemap = await client.sitemap.list();
assert(sitemap.length > 0);
const leaf = await client.sitemap.list(sitemap[0]!.url);
assert(leaf.length > 0);
console.log('sitemap children', sitemap.length, 'first child entries', leaf.length);
for (const name of ['felir', 'eutr', 'primaryProducers'] as const) {
  const registry = await client.registries.describe(name);
  assert(registry.requiresCaptcha);
  assert(Object.keys(registry.endpoints).length > 0);
  console.log(name, 'lookup endpoints', Object.keys(registry.endpoints).length);
}
const producers = await client.localProducers.list();
assert(producers.items.some((table) => table.rows.length));
console.log('producer tables', producers.items.length);
const newsDetail = await client.news.get(news.items[0]!.url);
assert(newsDetail.text && newsDetail.lead);
console.log('article detail', newsDetail.title);
const notices = await client.notices.list();
assert(notices.items.length > 0);
console.log('notices', notices.items.length);
for (const category of ['food', 'pesticideResidues', 'veterinaryProducts', 'timber'] as const) {
  const listing = await client.violations.list(category);
  assert(listing.items.length > 0);
  console.log('violations', category, listing.items.length);
}
for (const category of ['food', 'veterinaryProducts'] as const) {
  const first = (await client.violations.list(category)).items[0]!;
  assert(first.url);
  const detail = await client.violations.detail(category, first.url);
  assert(detail.operatorAddress && detail.description && detail.authority);
  console.log('violation detail', category, detail.id);
}
const substances = await client.datasets.list('activeSubstances');
assert(substances.items[0]?.url);
const substance = await client.datasets.detail('activeSubstances', substances.items[0].url);
assert(substance.substance && substance.regulatoryStatus);
console.log('substance detail', substance.substance);
const additive = await client.additives.get(additives.items[0]!.url!);
assert(additive.description);
console.log('additive detail', additive.code);
const contacts = await client.contacts.list();
assert(contacts.some((contact) => contact.emails.length));
console.log('contacts', contacts.length);
console.log('Live smoke checks passed');
