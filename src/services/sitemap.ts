import { load } from 'cheerio';
import { ParseError } from '../core/errors.js';
import { normalizeUrl, positiveInteger } from '../core/url.js';
import type { Transport } from '../core/transport.js';
import type { RequestOptions, SitemapEntry } from '../types.js';

export class SitemapService {
  constructor(private readonly transport: Transport) {}

  async list(path = '/sitemap.xml', options: RequestOptions = {}): Promise<SitemapEntry[]> {
    const response = await this.transport.get(path, options);
    const $ = load(this.transport.decode(response), { xml: true });
    const index = $('sitemapindex').length > 0;
    if (!index && !$('urlset').length) throw new ParseError(`Invalid sitemap at ${response.url}`);
    return $(index ? 'sitemapindex > sitemap' : 'urlset > url')
      .toArray()
      .flatMap((element) => {
        const node = $(element);
        const value = node.children('loc').text().trim();
        if (!value) return [];
        const priorityText = node.children('priority').text().trim();
        const priority = priorityText ? Number(priorityText) : null;
        return [
          {
            url: new URL(value, response.url).href,
            lastModified: node.children('lastmod').text().trim() || null,
            changeFrequency: node.children('changefreq').text().trim() || null,
            priority: priority !== null && Number.isFinite(priority) ? priority : null,
            isIndex: index,
          },
        ];
      });
  }

  async *iterate(
    options: RequestOptions & { path?: string; maxSitemaps?: number } = {},
  ): AsyncGenerator<SitemapEntry> {
    const max = positiveInteger(options.maxSitemaps ?? 1000, 'maxSitemaps');
    const queue = [options.path ?? '/sitemap.xml'];
    const visited = new Set<string>();
    const emitted = new Set<string>();
    for (let index = 0; index < queue.length && visited.size < max; index++) {
      options.signal?.throwIfAborted();
      const path = queue[index];
      if (!path) continue;
      const key = normalizeUrl(this.transport.resolve(path));
      if (visited.has(key)) continue;
      visited.add(key);
      for (const entry of await this.list(path, options)) {
        if (entry.isIndex) queue.push(entry.url);
        else if (!emitted.has(entry.url)) {
          emitted.add(entry.url);
          yield entry;
        }
      }
    }
  }
}
