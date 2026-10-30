import type { Page } from '../types.js';
import { resolveUrl } from '../core/url.js';
import { cleanText, contentRoot, createDom, extractLinks, parseDate, textContent } from './dom.js';
import { extractAccordions } from './accordions.js';
import { extractForms } from './forms.js';
import { extractSections } from './fields.js';
import { extractPagination } from './pagination.js';
import { documentLinks, extractImages } from './media.js';
import { extractTables } from './tables.js';

export function parsePage(html: string, url: string): Page {
  const $ = createDom(html);
  const root = contentRoot($);
  const links = extractLinks($, root, url);
  const content = root.clone();
  content.find('script, style, noscript, template, .taglib-social-bookmarks').remove();
  const label = cleanText(root.find('date, time, .publish-date').first().text()) || null;
  const metaDate = $('meta[property="article:published_time"]').attr('content');
  const canonicalUrl = resolveUrl($('link[rel="canonical"]').attr('href'), url);
  const forms = extractForms($, root, url);
  const embeds = root
    .find('iframe[src], video[src], audio[src], source[src], object[data], embed[src]')
    .toArray()
    .flatMap((element) => {
      const node = $(element);
      const value = resolveUrl(node.attr('src') ?? node.attr('data'), url);
      return value
        ? [
            {
              type: 'name' in element ? element.name : 'embed',
              url: value,
              title: node.attr('title') ?? '',
            },
          ]
        : [];
    });
  const fields = root
    .find('.field-wrapper-content')
    .toArray()
    .map((element) => {
      const node = $(element).clone();
      const label = cleanText(node.children('label').text());
      node.children('label').remove();
      return {
        label,
        text: textContent(node),
        html: node.html() ?? '',
        links: extractLinks($, node, url),
      };
    });
  root.find('dl > dt').each((_, element) => {
    const value = $(element).next('dd');
    fields.push({
      label: cleanText($(element).text()),
      text: textContent(value),
      html: value.html() ?? '',
      links: extractLinks($, value, url),
    });
  });
  return {
    url,
    canonicalUrl,
    title: cleanText(
      $('meta[property="og:title"]').attr('content') ||
        root.find('h1:not(.hide-accessible)').first().text() ||
        $('title').text(),
    ).replace(/\s*[-–|]\s*Nébih\s*$/u, ''),
    description:
      $('meta[name="description"]').attr('content') ??
      $('meta[property="og:description"]').attr('content') ??
      null,
    language: $('html').attr('lang') ?? 'hu',
    publishedAt: parseDate(metaDate ?? root.find('time').attr('datetime') ?? label),
    publishedLabel: label,
    text: textContent(content),
    html: content.html() ?? '',
    headings: root
      .find('h1, h2, h3, h4, h5, h6')
      .toArray()
      .map((element) => ({
        level: Number('name' in element ? element.name.slice(1) : 0),
        text: cleanText($(element).text()),
        id: $(element).attr('id') ?? null,
      }))
      .filter((heading) => !!heading.text),
    breadcrumbs: extractLinks($, $('.breadcrumb, .breadcrumbs').first(), url),
    links,
    documents: documentLinks(links),
    images: extractImages($, root, url),
    embeds,
    fields,
    accordions: extractAccordions($, root, url),
    sections: fields.length
      ? fields.flatMap((field) => extractSections(field.html, url))
      : extractSections(content.html() ?? '', url),
    tables: extractTables($, root, url),
    forms,
    blocks: root
      .find('.journal-content-article')
      .toArray()
      .map((element) => ({
        id: $(element).attr('data-analytics-asset-id') ?? null,
        title:
          $(element).attr('data-analytics-asset-title') ??
          cleanText($(element).find('h1, h2, h3').first().text()),
        text: textContent($(element)),
        html: $(element).clone().find('script, style').remove().end().html() ?? '',
      })),
    pagination: extractPagination($, root, url),
    warnings: [
      ...(forms.some((form) => form.requiresCaptcha)
        ? ['Some lookup forms require a user-completed CAPTCHA.']
        : []),
      ...(forms.some((form) => form.usesJavaScript)
        ? ['Some forms use JavaScript; use the registry lookup methods for supported forms.']
        : []),
      ...(embeds.length
        ? ['Embedded content is linked separately and is not fetched automatically.']
        : []),
    ],
  };
}
