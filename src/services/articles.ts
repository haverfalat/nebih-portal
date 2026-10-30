import { liferay } from '../core/liferay.js';
import { parseArticleDetail } from '../parsers/details/article.js';
import type { ArticleDetail } from '../models/details.js';
import type { ArticleSummary, RequestOptions } from '../types.js';
import { extractArticles } from '../parsers/articles.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';

export class ArticlesService extends ListingService<ArticleSummary> {
  constructor(pages: PagesService, path: string) {
    super(pages, path, extractArticles, liferay.articlePortlet, (item) => item.url);
  }

  async get(path: string, options: RequestOptions = {}): Promise<ArticleDetail> {
    return parseArticleDetail(await this.pages.get(path, options));
  }
}
