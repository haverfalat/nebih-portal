import { load, type Cheerio, type CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { resolveUrl } from '../core/url.js';
import type { Link } from '../types.js';

export type Selection = Cheerio<AnyNode>;

export function cleanText(value: string): string {
  return value.replace(/[\s\u00a0]+/gu, ' ').trim();
}

export function textContent(node: Selection): string {
  const copy = node.clone();
  copy
    .find(
      'script, style, noscript, template, button, input, select, textarea, [aria-hidden="true"]',
    )
    .remove();
  const normalizeNodes = (nodes: AnyNode[]): void => {
    for (const node of nodes) {
      if (node.type === 'text') node.data = node.data.replace(/[\s\u00a0]+/gu, ' ');
      else if ('children' in node) normalizeNodes(node.children);
    }
  };
  normalizeNodes(copy.toArray());
  copy.find('br').replaceWith('\n');
  copy.find('p, div, article, section, li, tr, h1, h2, h3, h4, h5, h6').each((_, element) => {
    copy.find(element).append('\n');
  });
  return copy.text().split('\n').map(cleanText).filter(Boolean).join('\n');
}

export function createDom(html: string): CheerioAPI {
  const $ = load(html);
  $('[id^="new_"]').each((_, element) => {
    const id = $(element)
      .attr('id')
      ?.match(/_(\d+)$/)?.[1];
    const old = id ? $(`[id="old_${id}"]`).first() : null;
    if (old?.length && !$(element).find('a').length)
      $(element).append(old.clone().removeAttr('id'));
  });
  return $;
}

export function contentRoot($: CheerioAPI): Selection {
  for (const selector of ['#main-content', 'main', '[role="main"]', 'body']) {
    const root = $(selector).first();
    if (root.length) return root;
  }
  return $.root();
}

export function linkFrom($: CheerioAPI, element: AnyNode, base: string): Link | null {
  const node = $(element);
  const raw = node.attr('href')?.trim();
  if (!raw || raw.startsWith('#')) return null;
  const url = resolveUrl(raw, base);
  if (!url) return null;
  return {
    title:
      cleanText(node.text()) ||
      node.attr('title') ||
      node.attr('aria-label') ||
      node.find('img').attr('alt') ||
      '',
    url,
    external: new URL(url).origin !== new URL(base).origin,
  };
}

export function extractLinks($: CheerioAPI, root: Selection, base: string): Link[] {
  const links = new Map<string, Link>();
  root.find('a[href]').each((_, element) => {
    const link = linkFrom($, element, base);
    if (link) {
      const existing = links.get(link.url);
      if (!existing || (!existing.title && link.title)) links.set(link.url, link);
    }
  });
  return [...links.values()];
}

const months = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
];

export function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const numeric = /\b(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})\b/.exec(value);
  const named = /\b(\d{4})\.\s*([\p{L}]+)\s+(\d{1,2})\b/u.exec(value.toLowerCase());
  const reversed = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(value);
  const match =
    numeric ?? named ?? (reversed ? [reversed[0], reversed[3]!, reversed[2]!, reversed[1]!] : null);
  if (!match) return null;
  const year = Number(match[1]);
  const month =
    numeric || (!named && reversed) ? Number(match[2]) : months.indexOf(match[2] ?? '') + 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    month < 1 ||
    month > 12 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function normalizeText(value: string): string {
  return cleanText(value).toLocaleLowerCase('hu').normalize('NFD').replace(/\p{M}/gu, '');
}
