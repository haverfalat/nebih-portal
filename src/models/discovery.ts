import type { RequestOptions } from './request.js';
import type { Page } from './content.js';

export interface SitemapEntry {
  url: string;
  lastModified: string | null;
  changeFrequency: string | null;
  priority: number | null;
  isIndex: boolean;
}

export interface CrawlOptions extends RequestOptions {
  start?: string;
  maxPages?: number;
  maxDepth?: number;
  include?: (url: string) => boolean;
  onError?: (error: unknown, url: string) => void;
}

export interface CrawlEntry {
  page: Page;
  depth: number;
}
