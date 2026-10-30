import { liferay } from '../core/liferay.js';
import { routes } from '../routes.js';
import { ParseError, ValidationError } from '../core/errors.js';
import { positiveInteger } from '../core/url.js';
import { createDom } from '../parsers/dom.js';
import { extractArticles } from '../parsers/articles.js';
import type { ArticleSummary, IterateOptions, Listing, SearchOptions } from '../types.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';

export class SearchService {
  constructor(private readonly pages: PagesService) {}

  async query(keywords: string, options: SearchOptions = {}): Promise<Listing<ArticleSummary>> {
    const listing = await this.createListing(keywords, options);
    return listing.list(options);
  }

  async *iterate(
    keywords: string,
    options: SearchOptions & IterateOptions = {},
  ): AsyncGenerator<ArticleSummary> {
    const listing = await this.createListing(keywords, options);
    yield* listing.iterate(options);
  }

  private async createListing(
    keywords: string,
    options: SearchOptions,
  ): Promise<ListingService<ArticleSummary>> {
    if (!keywords.trim()) throw new ValidationError('Search keywords cannot be empty');
    if (options.page !== undefined) positiveInteger(options.page, 'page');
    const source = await this.pages.source(routes.home, options);
    const $ = createDom(source.html);
    const form = $('form')
      .filter((_, element) => $(element).find('input[name$="_keywords"]').length > 0)
      .first();
    if (!form.length) throw new ParseError('The portal search form was not found');
    const target = new URL(form.attr('action') || source.url, source.url);
    form.find('input[type="hidden"][name]').each((_, element) => {
      const node = $(element);
      target.searchParams.set(node.attr('name')!, node.attr('value') ?? '');
    });
    const keywordField = form.find('input[name$="_keywords"]').attr('name');
    if (!keywordField) throw new ParseError('The search keyword field was not found');
    target.searchParams.set(keywordField, keywords.trim());
    const scope = form.find('input[name$="_scope"]').attr('name');
    if (scope) target.searchParams.set(scope, options.scope ?? 'this-site');
    return new ListingService(this.pages, target.href, extractArticles, liferay.searchPortlet);
  }
}
