import type { Link, Image, DocumentLink } from './links.js';
import type { DataTable } from './tables.js';
import type { PublicForm } from './forms.js';
import type { Pagination } from './listing.js';

export interface ContentField {
  label: string;
  text: string;
  html: string;
  links: Link[];
}

export interface ContentBlock {
  id: string | null;
  title: string;
  text: string;
  html: string;
}

export interface Accordion {
  id: string | null;
  title: string;
  text: string;
  html: string;
  links: Link[];
}

export interface Page {
  url: string;
  canonicalUrl: string | null;
  title: string;
  description: string | null;
  language: string;
  publishedAt: string | null;
  publishedLabel: string | null;
  text: string;
  html: string;
  headings: Array<{ level: number; text: string; id: string | null }>;
  breadcrumbs: Link[];
  links: Link[];
  documents: DocumentLink[];
  images: Image[];
  embeds: Array<{ type: string; url: string; title: string }>;
  tables: DataTable[];
  forms: PublicForm[];
  blocks: ContentBlock[];
  fields: ContentField[];
  sections: ContentField[];
  accordions: Accordion[];
  pagination: Pagination[];
  warnings: string[];
}

export interface RenderedDocument {
  url: string;
  html: string;
}
