import { liferay } from '../core/liferay.js';
import { routes } from '../routes.js';
import { ValidationError } from '../core/errors.js';
import { extractArticles } from '../parsers/articles.js';
import { parseArticleDetail } from '../parsers/details/article.js';
import type {
  ArticleSummary,
  IterateOptions,
  Link,
  Listing,
  ListOptions,
  Page,
  RequestOptions,
} from '../types.js';
import type { ArticleDetail } from '../models/details.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';

export const noticeCategories = {
  books: routes.bookNotices,
  other: routes.otherNotices,
  stamps: routes.stampNotices,
  timber: routes.timberNotices,
} as const;
export type NoticeCategory = keyof typeof noticeCategories;
export interface Notice extends ArticleSummary {
  category: NoticeCategory;
}

export class NoticesService {
  constructor(private readonly pages: PagesService) {}

  index(options: RequestOptions = {}): Promise<Page> {
    return this.pages.get(routes.notices, options);
  }

  async categories(options: RequestOptions = {}): Promise<Link[]> {
    return (await this.index(options)).links;
  }

  records(category: NoticeCategory): ListingService<Notice> {
    const path = noticeCategories[category];
    if (!path) throw new ValidationError(`Unknown notice category: ${String(category)}`);
    return new ListingService(
      this.pages,
      path,
      ($, root, url) => extractArticles($, root, url).map((article) => ({ ...article, category })),
      liferay.articlePortlet,
      (item) => item.url,
    );
  }

  async list(
    category: NoticeCategory | 'all' = 'all',
    options: ListOptions = {},
  ): Promise<Listing<Notice>> {
    if (category !== 'all') return this.records(category).list(options);
    const items: Notice[] = [];
    for (const name of Object.keys(noticeCategories) as NoticeCategory[])
      items.push(...(await this.records(name).list(options)).items);
    return {
      url: this.pages.transport.resolve(routes.notices),
      items,
      pagination: null,
    };
  }

  async *iterate(
    category: NoticeCategory | 'all' = 'all',
    options: IterateOptions = {},
  ): AsyncGenerator<Notice> {
    const categories =
      category === 'all' ? (Object.keys(noticeCategories) as NoticeCategory[]) : [category];
    for (const name of categories) yield* this.records(name).iterate(options);
  }

  async get(url: string, options: RequestOptions = {}): Promise<ArticleDetail> {
    return parseArticleDetail(await this.pages.get(url, options));
  }
}
