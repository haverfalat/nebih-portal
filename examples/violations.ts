import { NebihClient } from '../src/index.js';

const client = new NebihClient();
const result = await client.violations.list('food');

for (const record of result.items.slice(0, 5)) {
  console.log({
    id: record.id,
    date: record.date,
    operator: record.operatorName,
    product: record.productOrActivity,
  });
}

const first = result.items[0];
if (first?.url) {
  const detail = await client.violations.detail('food', first.url);
  console.log({
    address: detail.operatorAddress,
    executives: detail.executiveOfficers,
    description: detail.description,
    authority: detail.authority,
  });
}
