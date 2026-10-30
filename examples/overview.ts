import { NebihClient } from '../src/index.js';

const client = new NebihClient();
const news = await client.news.list();
console.log(news.items.map((item) => ({ title: item.title, date: item.publishedAt })));

const recalls = await client.recalls.list();
if (recalls.items[0]?.url) console.log(await client.recalls.get(recalls.items[0].url));

const producers = await client.datasets.list('producers');
console.log(
  producers.items.slice(0, 3).map((item) => ({ name: item.name, address: item.address })),
);

const faq = await client.pages.get(
  '/gyik/elelmiszer/gyakran-ismetelt-kerdesek/elelmiszerbiztonsag',
);
console.log(faq.accordions.map((item) => ({ question: item.title, answer: item.text })));
