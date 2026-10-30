import type { Page } from '../../types.js';
import type { ViolationDetailCategory, ViolationDetailMap } from '../../models/violations.js';
import { parseDate } from '../dom.js';
import { fieldText } from '../fields.js';
import { detailLabels } from './labels.js';
import { detailContext, relatedLinks } from '../record-fields.js';

export function parseViolationDetail<C extends ViolationDetailCategory>(
  category: C,
  page: Page,
): ViolationDetailMap[C] {
  const { fields, ...context } = detailContext(page, detailLabels, ['Részletek']);
  const base = {
    ...context,
    date: parseDate(fieldText(fields, ...detailLabels.date)),
    operatorName: fieldText(fields, ...detailLabels.operator),
    operatorAddress: fieldText(fields, ...detailLabels.address),
    productName: fieldText(fields, ...detailLabels.product),
    description: fieldText(page.sections, ...detailLabels.description),
    authority: fieldText(fields, ...detailLabels.authority),
    relatedArticles: relatedLinks(fields, detailLabels.related, page.url).map((link) => link.url),
  };
  if (category === 'food')
    return {
      ...base,
      category,
      productOrActivity: fieldText(fields, ...detailLabels.activity),
      executiveOfficers: fieldText(fields, ...detailLabels.executives),
      productIdentification: fieldText(fields, ...detailLabels.identification),
    } as ViolationDetailMap[C];
  return {
    ...base,
    category,
    companyName: fieldText(fields, ...detailLabels.operator),
  } as ViolationDetailMap[C];
}
