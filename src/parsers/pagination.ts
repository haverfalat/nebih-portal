import type { CheerioAPI } from 'cheerio';
import type { Pagination } from '../types.js';
import { resolveUrl } from '../core/url.js';
import { cleanText, normalizeText, type Selection } from './dom.js';

export function extractPagination($: CheerioAPI, root: Selection, base: string): Pagination[] {
  const result: Pagination[] = [];
  const groups = root.find('.lfr-pagination, .pagination-bar, .taglib-page-iterator');
  groups.each((_, element) => {
    const group = $(element);
    if (group.parents('.lfr-pagination, .pagination-bar, .taglib-page-iterator').length) return;
    const anchors = group.find('a[href]').toArray();
    let template: URL | null = null;
    for (const anchor of anchors) {
      const value = resolveUrl($(anchor).attr('href'), base);
      if (!value) continue;
      const candidate = new URL(value);
      if ([...candidate.searchParams.keys()].some((key) => key === 'cur' || key.endsWith('_cur'))) {
        template = candidate;
        break;
      }
    }
    if (!template) return;
    const pageParameter =
      [...template.searchParams.keys()].find((key) => key === 'cur' || key.endsWith('_cur')) ??
      null;
    const pageSizeParameter =
      [...template.searchParams.keys()].find((key) => key === 'delta' || key.endsWith('_delta')) ??
      (pageParameter ? pageParameter.replace(/cur$/, 'delta') : null);
    const current = new URL(base);
    const currentPage = Math.max(
      1,
      Number(pageParameter ? current.searchParams.get(pageParameter) : 1) || 1,
    );
    const pageSize =
      Number(
        pageSizeParameter
          ? (current.searchParams.get(pageSizeParameter) ??
              template.searchParams.get(pageSizeParameter))
          : null,
      ) || null;
    const pages = anchors
      .map((anchor) => {
        const url = resolveUrl($(anchor).attr('href'), base);
        return url && pageParameter ? Number(new URL(url).searchParams.get(pageParameter)) : 0;
      })
      .filter(Number.isFinite);
    const text = cleanText(group.text());
    const totalMatch =
      /(?:összesen\s*:?\s*|\/\s*)([\d\s.,]+)\s*(?:találat|tétel|elem|eredmény|entries|results)/iu.exec(
        text,
      );
    const singleTotal = /^(\d[\d\s.,]*)\s+(?:tétel|találat|entries|results)/iu.exec(
      cleanText(group.find('.search-results').text()),
    );
    const totalItems = Number((totalMatch?.[1] ?? singleTotal?.[1])?.replace(/\D/g, '')) || null;
    let nextUrl: string | null = null;
    let previousUrl: string | null = null;
    for (const anchor of anchors) {
      const node = $(anchor);
      if (node.closest('.disabled, [aria-disabled="true"]').length) continue;
      const label = normalizeText(node.attr('aria-label') || node.text());
      const value = resolveUrl(node.attr('href'), base);
      if (!value || node.attr('href')?.startsWith('javascript:')) continue;
      if (node.attr('rel') === 'next' || /kovetkezo|next/.test(label)) nextUrl = value;
      if (node.attr('rel') === 'prev' || /elozo|previous/.test(label)) previousUrl = value;
    }
    const maximumPage = Math.max(currentPage, ...pages);
    const totalPages =
      totalItems && pageSize
        ? Math.ceil(totalItems / pageSize)
        : maximumPage >= 1
          ? maximumPage
          : null;
    result.push({
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      nextUrl,
      previousUrl,
      pageParameter,
      pageSizeParameter,
      templateUrl: template.href,
    });
  });
  return result;
}
