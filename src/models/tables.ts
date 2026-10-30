import type { Link } from './links.js';

export interface TableCell {
  text: string;
  html: string;
  links: Link[];
  rowSpan: number;
  columnSpan: number;
}

export interface TableRow {
  id: string | null;
  cells: TableCell[];
}

export interface DataTable {
  id: string | null;
  caption: string | null;
  headers: string[];
  rows: TableRow[];
}
