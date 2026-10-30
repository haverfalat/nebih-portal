import { ValidationError } from '../core/errors.js';
import type { RegistryQuery } from './types.js';

export function buildRegistryQuery(query: RegistryQuery): {
  fields: URLSearchParams;
  endpoints: string[];
} {
  const fields = new URLSearchParams();
  const required = (key: string, value: string | undefined): void => {
    if (!value?.trim()) throw new ValidationError(`${key} cannot be empty`);
    fields.set(key, value.trim());
  };
  switch (query.type) {
    case 'felir':
      if (!/^[A-Z]{2}\d{7}$/.test(query.number))
        throw new ValidationError(
          'FELIR numbers must contain two uppercase letters followed by seven digits',
        );
      fields.set('felir', query.number);
      fields.set('dokId', '');
      return { fields, endpoints: ['searchFelirSubmitClickURL'] };
    case 'taxNumber':
      if (!/^\d{8}$/.test(query.number))
        throw new ValidationError('The tax number must contain eight digits');
      fields.set('vat', query.number);
      return { fields, endpoints: ['searchLegalPersonalSubmitClickURL'] };
    case 'naturalPerson':
      required('name', query.name);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(query.birthDate))
        throw new ValidationError('birthDate must use YYYY-MM-DD');
      fields.set('birthDate', query.birthDate);
      return { fields, endpoints: ['searchNaturalPersonalSubmitClickURL'] };
    case 'company':
      required('companyCountry', query.country);
      if (!!query.name?.trim() === !!query.registrationNumber?.trim())
        throw new ValidationError('Supply either a company name or registration number');
      required(
        query.name ? 'companyName' : 'companyIdNumber',
        query.name ?? query.registrationNumber,
      );
      return { fields, endpoints: ['searchCompanySubmitClickURL'] };
    case 'activity':
      required('tevId', query.id);
      return { fields, endpoints: ['searchTevIdSubmitClickUrl', 'searchAtcivitySubmitClickURL'] };
    case 'establishment':
      required('estId', query.id);
      return { fields, endpoints: ['searchEstIdSubmitClickUrl'] };
    case 'familyFarm':
      required('ocsgId', query.id);
      return { fields, endpoints: ['searchOCSGSubmitClickUrl'] };
    case 'familyEnterprise':
      required('csgId', query.id);
      return { fields, endpoints: ['searchOCSGSubmitClickUrl'] };
    default:
      throw new ValidationError('Unsupported registry query');
  }
}
