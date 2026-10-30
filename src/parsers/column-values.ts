import type { ColumnDefinition } from '../datasets/schema.js';
import { parseDate } from './dom.js';
import { parseBoolean, parseNumber } from './fields.js';

export function columnValue(
  value: string | null,
  column: ColumnDefinition,
): string | number | boolean | null {
  if (column.kind === 'number') return parseNumber(value);
  if (column.kind === 'date') return parseDate(value);
  if (column.kind === 'boolean') return parseBoolean(value);
  return value || null;
}
