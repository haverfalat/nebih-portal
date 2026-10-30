import { ParseError } from '../core/errors.js';
import { recordPath, recordTarget } from '../core/record-url.js';
import type { Page, RequestOptions } from '../types.js';
import type { PagesService } from './pages.js';

export async function readRecordPage(
  pages: PagesService,
  path: string,
  idOrUrl: string,
  options: RequestOptions,
): Promise<Page> {
  const page = await pages.get(recordTarget(path, idOrUrl), options);
  if (!new URL(page.url).pathname.startsWith(recordPath(path))) {
    throw new ParseError(`Expected a detail page for ${path}`);
  }
  if (!page.fields.length) throw new ParseError(`No structured detail fields found at ${page.url}`);
  return page;
}
