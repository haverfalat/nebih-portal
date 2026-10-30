import type { DataTable, TableCell, TableRow } from '../types.js';

export function expandRows(table: DataTable): TableRow[] {
  const pending = new Map<number, { cell: TableCell; remaining: number }>();
  return table.rows.map((row) => {
    const cells: TableCell[] = [];
    const carried = new Set<number>();
    let column = 0;
    const fill = (): void => {
      while (pending.has(column)) {
        cells[column] = pending.get(column)!.cell;
        carried.add(column);
        column++;
      }
    };
    for (const cell of row.cells) {
      fill();
      for (let offset = 0; offset < cell.columnSpan; offset++) {
        cells[column] = cell;
        if (cell.rowSpan > 1) pending.set(column, { cell, remaining: cell.rowSpan });
        column++;
      }
    }
    fill();
    for (const [index, value] of pending) {
      if (carried.has(index) || cells[index] === value.cell) value.remaining--;
      if (value.remaining <= 0) pending.delete(index);
    }
    return { id: row.id, cells };
  });
}
