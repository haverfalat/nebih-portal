import type { Page } from '../../types.js';
import type { RecallDetail } from '../../models/details.js';
import { parseDate } from '../dom.js';
import { detailContext, mapTextFields, requireField } from '../record-fields.js';
import { recallFields } from './recall-fields.js';

export function parseRecallDetail(page: Page): RecallDetail {
  requireField(page, 'Termék neve');
  const { fields, ...context } = detailContext(page, recallFields, [
    'Részletek',
    'Kép a termékekről',
    'Kép a termékről',
  ]);
  const values = mapTextFields(fields, recallFields);
  return {
    ...context,
    ...values,
    date: parseDate(values.date),
    images: page.images,
    tables: page.tables,
  };
}
