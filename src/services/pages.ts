import { routes } from '../routes.js';
import { ParseError, ValidationError } from '../core/errors.js';
import type { Transport } from '../core/transport.js';
import { normalizeUrl, positiveInteger } from '../core/url.js';
import { parsePage } from '../parsers/page.js';
import type { CrawlEntry, CrawlOptions, Page, RenderedDocument, RequestOptions } from '../types.js';

export class PagesService {
  constructor(readonly transport: Transport) {}

  async source(path: string, options: RequestOptions = {}): Promise<RenderedDocument> {
    const response = await this.transport.get(path, options);
    const type = response.headers.get('content-type') ?? '';
    if (type && !/html|xhtml/i.test(type))
      throw new ParseError(`Expected HTML at ${response.url}, received ${type}`);
    return { url: response.url, html: this.transport.decode(response) };
  }

  async get(path: string = routes.home, options: RequestOptions = {}): Promise<Page> {
    const source = await this.source(path, options);
    return parsePage(source.html, source.url);
  }

  async *crawl(options: CrawlOptions = {}): AsyncGenerator<CrawlEntry> {
    const maxPages = positiveInteger(options.maxPages ?? 100, 'maxPages');
    const maxDepth = options.maxDepth ?? 2;
    if (!Number.isSafeInteger(maxDepth) || maxDepth < 0)
      throw new ValidationError('maxDepth must be a non-negative integer');
    const start = this.transport.resolve(options.start ?? routes.home);
    const origin = new URL(start).origin;
    const queue = [{ url: start, depth: 0 }];
    const seen = new Set([normalizeUrl(start)]);
    let count = 0;
    for (let index = 0; index < queue.length && count < maxPages; index++) {
      options.signal?.throwIfAborted();
      const item = queue[index];
      if (!item) break;
      let page: Page;
      try {
        page = await this.get(item.url, options);
      } catch (error) {
        options.signal?.throwIfAborted();
        if (!options.onError) throw error;
        options.onError(error, item.url);
        continue;
      }
      count++;
      yield { page, depth: item.depth };
      if (item.depth >= maxDepth) continue;
      const documents = new Set(page.documents.map((link) => link.url));
      for (const link of page.links) {
        const url = new URL(link.url);
        if (
          url.origin !== origin ||
          documents.has(link.url) ||
          !['http:', 'https:'].includes(url.protocol)
        )
          continue;
        if (
          url.pathname === '/search' ||
          url.pathname.startsWith('/search/') ||
          /\/(?:o|c|image)\//.test(url.pathname)
        )
          continue;
        if ([...url.searchParams.keys()].some((key) => /^p_p_|_cur$|_delta$|redirect/i.test(key)))
          continue;
        url.hash = '';
        url.searchParams.delete('p_l_back_url');
        const key = normalizeUrl(url.href);
        if (seen.has(key) || (options.include && !options.include(url.href))) continue;
        seen.add(key);
        queue.push({ url: url.href, depth: item.depth + 1 });
      }
    }
  }
}
