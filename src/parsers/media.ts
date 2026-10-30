import type { CheerioAPI } from 'cheerio';
import { documentExtension, isDocumentUrl, resolveUrl } from '../core/url.js';
import type { DocumentLink, Image, Link } from '../types.js';
import type { Selection } from './dom.js';

export function documentLinks(links: Link[]): DocumentLink[] {
  return links
    .filter((link) => isDocumentUrl(link.url))
    .map((link) => ({ ...link, extension: documentExtension(link.url) }));
}

export function extractImages($: CheerioAPI, root: Selection, base: string): Image[] {
  return root
    .find('img')
    .toArray()
    .flatMap((element) => {
      const node = $(element);
      const url = resolveUrl(node.attr('src') ?? node.attr('data-src'), base);
      return url ? [{ url, alt: node.attr('alt') ?? '', title: node.attr('title') ?? null }] : [];
    });
}
