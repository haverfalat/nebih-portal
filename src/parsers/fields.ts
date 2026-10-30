import { load } from 'cheerio';
import type { ContentField } from '../types.js';
import { cleanText, extractLinks, normalizeText, textContent, type Selection } from './dom.js';

export function normalizeLabel(value: string): string {
  return normalizeText(value)
    .replace(/[:：]\s*$/, '')
    .trim();
}

export function findField(fields: ContentField[], labels: string[]): ContentField | undefined {
  const aliases = new Set(labels.map(normalizeLabel));
  return fields.find((field) => aliases.has(normalizeLabel(field.label)));
}

export function fieldText(fields: ContentField[], ...labels: string[]): string | null {
  const value = findField(fields, labels)?.text;
  return value && !/^[-–—]+$/.test(value.trim()) ? cleanText(value) : null;
}

export function extractSections(html: string, base: string): ContentField[] {
  const $ = load(html, {}, false);
  $('script, style, noscript').remove();
  $('strong, b').each((_, element) => {
    const node = $(element);
    const label = cleanText(node.text());
    const next = element.nextSibling;
    const colonAfter = next?.type === 'text' && /^\s*[:：]/u.test(next.data);
    if (!label || label.length >= 180 || (!/[:：]$/.test(label) && !colonAfter)) return;
    if (colonAfter && next?.type === 'text') next.data = next.data.replace(/^\s*[:：]\s*/u, '');
    const marker = $('<nebih-field></nebih-field>').attr(
      'data-label',
      label.replace(/[:：]$/, '').trim(),
    );
    node.replaceWith(marker);
  });
  const sections: ContentField[] = [];
  let current: { label: string; fragments: string[] } | null = null;
  const finish = (): void => {
    if (!current) return;
    const html = current.fragments.join('');
    const value = load(html, {}, false);
    sections.push({
      label: current.label,
      text: textContent(value.root()),
      html,
      links: extractLinks(value, value.root(), base),
    });
  };
  const visit = (node: Selection): void => {
    node.contents().each((_, element) => {
      const block = $(element);
      if (block.is('nebih-field')) {
        finish();
        current = { label: block.attr('data-label') ?? '', fragments: [] };
      } else if (block.find('nebih-field').length > 0) {
        visit(block);
        if (current && block.is('p, div, li, section')) current.fragments.push('<br>');
      } else if (current) {
        current.fragments.push($.html(element));
      }
    });
  };
  visit($.root());
  finish();
  return sections;
}

export function textLinks(value: string, base: string): string[] {
  const result = new Set<string>();
  for (const match of value.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    try {
      result.add(new URL(match[0].replace(/[.,;)]*$/, ''), base).href);
    } catch {}
  }
  return [...result];
}

export function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const text = value.replace(/\u00a0|\s/g, '').replace(',', '.');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}

export function parseBoolean(value: string | null | undefined): boolean | null {
  const text = normalizeText(value ?? '');
  if (['igen', 'true', '1'].includes(text)) return true;
  if (['nem', 'false', '0'].includes(text)) return false;
  return null;
}
