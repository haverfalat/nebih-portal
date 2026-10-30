import type { DataTable, TableRow } from '../../types.js';
import type { ViolationCategory, ViolationRecordMap } from '../../models/violations.js';
import { cleanText, parseDate } from '../dom.js';
import { parseBoolean, parseNumber } from '../fields.js';
import { rowContext } from '../table-records.js';

export function parseViolationRow<C extends ViolationCategory>(
  category: C,
  table: DataTable,
  row: TableRow,
): ViolationRecordMap[C] {
  const value = (index: number): string => cleanText(row.cells[index]?.text ?? '');
  const dateIndex = category === 'pesticideResidues' ? 1 : 0;
  const base = {
    ...rowContext(table, row),
    date: parseDate(value(dateIndex)),
    dateLabel: value(dateIndex),
  };
  let record: ViolationRecordMap[ViolationCategory];
  switch (category) {
    case 'food':
      record = { ...base, category, productOrActivity: value(1), operatorName: value(2) };
      break;
    case 'veterinaryProducts':
      record = { ...base, category, productName: value(1), companyName: value(2) };
      break;
    case 'pesticideResidues':
      record = {
        ...base,
        category,
        sampleNumber: value(0),
        sampledAt: base.date,
        origin: value(2),
        distributor: value(3),
        productName: value(4),
        activeSubstance: value(5),
        limitMgPerKg: parseNumber(value(6)),
        measuredMgPerKg: parseNumber(value(7)),
        limitLabel: value(6),
        measuredLabel: value(7),
      };
      break;
    case 'timber':
      record = {
        ...base,
        category,
        publishedAt: base.date,
        caseNumber: value(1),
        operatorName: value(2),
        address: value(3),
        activityProhibited: parseBoolean(value(4)),
        eutrCode: value(5),
        legalBasis: value(6),
        isFinal: parseBoolean(value(7)),
        authority: value(8),
        subject: value(9),
        findings: value(10),
        violatedProvisions: value(11),
        decision: value(12),
        appeal: value(13),
      };
      break;
    default:
      throw new Error('Unsupported violation category');
  }
  return record as ViolationRecordMap[C];
}
