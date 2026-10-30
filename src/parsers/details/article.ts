import type { Page } from '../../types.js';
import type { ArticleDetail } from '../../models/details.js';
import { ParseError } from '../../core/errors.js';
import { cleanText, createDom, extractLinks, parseDate, textContent } from '../dom.js';
import { extractImages, documentLinks } from '../media.js';

export function parseArticleDetail(page: Page): ArticleDetail {
  const $ = createDom(page.html);
  const article = $('article.article-details').first();
  if (!article.length) throw new ParseError(`No article detail layout found at ${page.url}`);
  const links = extractLinks($, article, page.url);
  const content = article.clone();
  content
    .find('h1, h2, date, time, .article-image, .taglib-social-bookmarks, script, style')
    .remove();
  const label = cleanText(article.find('date,time').first().text()) || null;
  return {
    id: article.closest('[data-analytics-asset-id]').attr('data-analytics-asset-id') ?? null,
    url: page.url,
    title: cleanText(article.find('h1,h2').first().text()) || page.title,
    publishedAt: parseDate(label),
    publishedLabel: label,
    lead: cleanText(article.find('.lead').first().text()),
    text: textContent(content),
    html: content.html() ?? '',
    links,
    images: extractImages($, article, page.url),
    documents: documentLinks(links),
    relatedArticles: page.links.filter(
      (link) =>
        /\/-\//.test(new URL(link.url).pathname) && !links.some((item) => item.url === link.url),
    ),
    page,
  };
}
