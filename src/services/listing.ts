import { ParseError } from '../core/errors.js';
import { normalizeUrl, positiveInteger } from '../core/url.js';
import { contentRoot, createDom } from '../parsers/dom.js';
import { extractPagination } from '../parsers/pagination.js';
import type { CheerioAPI } from 'cheerio';
import type { Selection } from '../parsers/dom.js';
import type { IterateOptions, Listing, ListOptions, Pagination } from '../types.js';
import type { PagesService } from './pages.js';

export type ItemParser<T> = ($: CheerioAPI, root: Selection, url: string) => T[];

export class ListingService<T> {
  constructor(
    protected readonly pages: PagesService,
    readonly path: string,
    private readonly parser: ItemParser<T>,
    private readonly paginationHint?: string,
    private readonly itemKey?: (item: T) => string,
  ) {}

  async list(options: ListOptions = {}): Promise<Listing<T>> {
    const page = positiveInteger(options.page ?? 1, 'page');
    if (options.pageSize !== undefined) positiveInteger(options.pageSize, 'pageSize', 1000);
    let result = await this.read(this.path, options);
    if (page !== 1 || options.pageSize !== undefined) {
      const pagination = result.pagination;
      if (!pagination?.templateUrl || !pagination.pageParameter) {
        if (page !== 1) throw new ParseError(`No server pagination found at ${result.url}`);
        return result;
      }
      const target = new URL(pagination.templateUrl);
      target.searchParams.set(pagination.pageParameter, String(page));
      if (options.pageSize !== undefined && pagination.pageSizeParameter)
        target.searchParams.set(pagination.pageSizeParameter, String(options.pageSize));
      target.searchParams.set('p_r_p_resetCur', 'false');
      result = await this.read(target.href, options);
    }
    return result;
  }

  async *iterate(options: IterateOptions = {}): AsyncGenerator<T> {
    const maxPages = positiveInteger(options.maxPages ?? 100, 'maxPages');
    let listing = await this.list(options);
    const visited = new Set<string>();
    const emitted = new Set<string>();
    for (let count = 0; count < maxPages; count++) {
      options.signal?.throwIfAborted();
      const key = normalizeUrl(listing.url);
      if (visited.has(key)) break;
      visited.add(key);
      for (const item of listing.items) {
        const identity = this.itemKey?.(item);
        if (identity !== undefined && emitted.has(identity)) continue;
        if (identity !== undefined) emitted.add(identity);
        yield item;
      }
      const next = listing.pagination?.nextUrl;
      if (!next || count + 1 >= maxPages) break;
      listing = await this.read(next, options);
    }
  }

  protected async read(path: string, options: ListOptions): Promise<Listing<T>> {
    const source = await this.pages.source(path, options);
    const $ = createDom(source.html);
    const root = contentRoot($);
    const paginations = extractPagination($, root, source.url);
    const pagination = this.selectPagination(paginations);
    return { url: source.url, items: this.parser($, root, source.url), pagination };
  }

  private selectPagination(paginations: Pagination[]): Pagination | null {
    return (
      (this.paginationHint
        ? paginations.find((item) => item.templateUrl?.includes(this.paginationHint!))
        : undefined) ??
      paginations[0] ??
      null
    );
  }
}
