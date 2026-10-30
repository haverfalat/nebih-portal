import type {
  Additive,
  ContentField,
  DocumentLink,
  Image,
  Link,
  Page,
  DataTable,
} from '../types.js';

export interface RecallDetail {
  id: string | null;
  url: string;
  date: string | null;
  product: string | null;
  reason: string | null;
  notifier: string | null;
  recallType: string | null;
  rasffReference: string | null;
  brand: string | null;
  origin: string | null;
  manufacturer: string | null;
  distributors: string | null;
  action: string | null;
  customerInformation: string | null;
  productIdentification: string | null;
  packaging: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  images: Image[];
  tables: DataTable[];
  sections: ContentField[];
  unmappedFields: ContentField[];
  page: Page;
}

export interface AdditiveDetail extends Omit<Additive, 'url'> {
  url: string;
  alternativeNames: string | null;
  description: string | null;
  permittedUses: string | null;
  notes: string | null;
  moreInformation: Link[];
  sections: ContentField[];
  unmappedFields: ContentField[];
  page: Page;
}

export interface ArticleDetail {
  id: string | null;
  url: string;
  title: string;
  publishedAt: string | null;
  publishedLabel: string | null;
  lead: string;
  text: string;
  html: string;
  images: Image[];
  documents: DocumentLink[];
  links: Link[];
  relatedArticles: Link[];
  page: Page;
}
