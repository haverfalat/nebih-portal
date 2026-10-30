import { liferay } from '../core/liferay.js';
import type { DataTable, TableRow } from '../types.js';
import { normalizeLabel } from './fields.js';
import { expandRows } from './table-rows.js';

export function visibleTables(tables: DataTable[]): DataTable[] {
  const displayed = tables.filter((table) => table.id === liferay.recordTableId);
  return displayed.length ? displayed : tables.filter((table) => table.headers.length > 0);
}

export function tableRows(tables: DataTable[]): Array<{ table: DataTable; row: TableRow }> {
  return tables.flatMap((table) => expandRows(table).map((row) => ({ table, row })));
}

export function headerIndex(table: DataTable, labels: readonly string[]): number {
  const aliases = new Set(labels.map(normalizeLabel));
  return table.headers.findIndex((header) => aliases.has(normalizeLabel(header)));
}

export function rowContext(table: DataTable, row: TableRow) {
  const links = row.cells.flatMap((cell) => cell.links);
  return {
    id: row.id,
    url: links.find((link) => /\/l\//.test(link.url))?.url ?? null,
    fields: row.cells.map((cell, index) => ({
      label: table.headers[index] || `Column ${index + 1}`,
      value: cell.text,
    })),
    links,
    row,
  };
}
