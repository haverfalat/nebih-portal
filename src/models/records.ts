import type { Image } from './links.js';
import type { TableCell } from './tables.js';

export interface ArticleSummary {
  id: string | null;
  title: string;
  url: string;
  summary: string;
  image: Image | null;
  publishedAt: string | null;
  publishedLabel: string | null;
}

export interface Recall {
  id: string | null;
  date: string | null;
  dateLabel: string;
  product: string;
  reason: string;
  url: string | null;
  cells: TableCell[];
}

export interface Additive {
  id: string | null;
  code: string;
  name: string;
  function: string;
  adverseEffects: string;
  url: string | null;
}
