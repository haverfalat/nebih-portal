import type { Page } from '../../types.js';
import type { AdditiveDetail } from '../../models/details.js';
import { detailContext, mapTextFields, relatedLinks, requireField } from '../record-fields.js';
import { additiveFields } from './additive-fields.js';

export function parseAdditiveDetail(page: Page): AdditiveDetail {
  requireField(page, 'E-szám');
  const { fields, ...context } = detailContext(page, additiveFields, ['Részletek']);
  const values = mapTextFields(fields, additiveFields);
  return {
    ...context,
    code: values.code ?? '',
    name: values.name ?? '',
    function: values.function ?? '',
    adverseEffects: values.adverseEffects ?? '',
    alternativeNames: values.alternativeNames,
    description: values.description,
    permittedUses: values.permittedUses,
    notes: values.notes,
    moreInformation: relatedLinks(fields, additiveFields.moreInformation, page.url),
  };
}
