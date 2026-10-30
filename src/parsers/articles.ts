import type { CheerioAPI } from 'cheerio';
import type { ArticleSummary } from '../types.js';
import { resolveUrl } from '../core/url.js';
import { cleanText, parseDate, type Selection } from './dom.js';

export function extractArticles($: CheerioAPI, root: Selection, base: string): ArticleSummary[] {
  const articles = new Map<string, ArticleSummary>();
  root
    .find(
      'a.nebih-article-big, a.nebih-article-small, .asset-abstract, .search-result, .list-group-item',
    )
    .each((_, element) => {
      const node = $(element);
      const anchor = node.is('a[href]')
        ? node
        : node.find('.asset-title a, .list-group-title a, h2 a, h3 a, a[href*="/-/"]').first();
      const url = resolveUrl(anchor.attr('href'), base);
      const title = cleanText(
        node.find('h2, h3, .asset-title, .list-group-title').first().text() || anchor.text(),
      );
      if (!url || !title) return;
      const label =
        cleanText(node.find('date, time, .publish-date, .asset-publish-date').first().text()) ||
        null;
      const dateValue = node.find('time').first().attr('datetime') ?? label;
      const image = node.find('img').first();
      const imageUrl = resolveUrl(image.attr('src'), base);
      articles.set(url, {
        id:
          node.find('[data-analytics-asset-id]').attr('data-analytics-asset-id') ??
          node.attr('data-analytics-asset-id') ??
          null,
        title,
        url,
        summary: cleanText(
          node
            .find('.lead, .asset-summary, .search-result-summary, .list-group-subtext')
            .first()
            .text(),
        ),
        image: imageUrl
          ? { url: imageUrl, alt: image.attr('alt') ?? '', title: image.attr('title') ?? null }
          : null,
        publishedAt: parseDate(dateValue),
        publishedLabel: label,
      });
    });
  return [...articles.values()];
}
