import type { DataTable } from '../types.js';
import { normalizeText } from './dom.js';
import { visibleTables } from './table-records.js';

export function selectTable(tables: DataTable[], columns: string[]): DataTable | undefined {
  const candidates = tables.filter((table) =>
    columns.every((column) =>
      table.headers.some((header) => normalizeText(header).includes(normalizeText(column))),
    ),
  );
  return visibleTables(candidates)[0];
}
