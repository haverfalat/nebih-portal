import { ParseError } from '../core/errors.js';
import { recordId } from '../core/record-url.js';
import type { ContentField, Link, Page } from '../types.js';
import { fieldText, normalizeLabel, textLinks } from './fields.js';

export type FieldMapping = Record<string, readonly string[]>;

export function mapTextFields<M extends FieldMapping>(
  fields: ContentField[],
  mapping: M,
): { [K in keyof M]: string | null } {
  return Object.fromEntries(
    Object.entries(mapping).map(([key, labels]) => [key, fieldText(fields, ...labels)]),
  ) as { [K in keyof M]: string | null };
}

export function unmappedFields(
  fields: ContentField[],
  labels: readonly string[],
  ignored: readonly string[] = [],
): ContentField[] {
  const known = new Set([...labels, ...ignored].map(normalizeLabel));
  return fields.filter((field) => field.label && !known.has(normalizeLabel(field.label)));
}

export function detailContext(page: Page, mapping: FieldMapping, ignored: readonly string[] = []) {
  const fields = [...page.fields.filter((field) => field.label), ...page.sections];
  return {
    fields,
    id: recordId(page.url),
    url: page.url,
    sections: page.sections,
    unmappedFields: unmappedFields(fields, Object.values(mapping).flat(), ignored),
    page,
  };
}

export function requireField(page: Page, label: string): void {
  if (!page.fields.some((field) => normalizeLabel(field.label) === normalizeLabel(label))) {
    throw new ParseError(`Missing ${label} detail field at ${page.url}`);
  }
}

export function relatedLinks(
  fields: ContentField[],
  labels: readonly string[],
  base: string,
): Link[] {
  const aliases = new Set(labels.map(normalizeLabel));
  const result = new Map<string, Link>();
  for (const field of fields.filter((field) => aliases.has(normalizeLabel(field.label)))) {
    for (const link of field.links) result.set(link.url, link);
    for (const url of textLinks(field.text, base)) {
      if (!result.has(url))
        result.set(url, {
          title: url,
          url,
          external: new URL(url).origin !== new URL(base).origin,
        });
    }
  }
  return [...result.values()];
}
