import { liferay } from '../core/liferay.js';
import { routes } from '../routes.js';
import { readRecordPage } from './record-page.js';
import { ValidationError } from '../core/errors.js';
import type {
  DocumentLink,
  IterateOptions,
  Link,
  ListOptions,
  Listing,
  Page,
  RequestOptions,
} from '../types.js';
import { extractTables } from '../parsers/tables.js';
import { parseViolationDetail } from '../parsers/violations/detail.js';
import { parseViolationRow } from '../parsers/violations/row.js';
import { tableRows, visibleTables } from '../parsers/table-records.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';
import { violationCategories } from '../models/violations.js';
import type {
  ViolationCategory,
  ViolationRecordMap,
  ViolationDetailCategory,
  ViolationDetailMap,
  ViolationDetail,
} from '../models/violations.js';

export { violationCategories } from '../models/violations.js';

export class ViolationsService {
  constructor(private readonly pages: PagesService) {}

  index(options: RequestOptions = {}): Promise<Page> {
    return this.pages.get(routes.violations, options);
  }

  async categories(options: RequestOptions = {}): Promise<Link[]> {
    return (await this.index(options)).links;
  }

  records<C extends ViolationCategory>(category: C): ListingService<ViolationRecordMap[C]> {
    const path = violationCategories[category];
    if (!path) throw new ValidationError(`Unknown violation category: ${String(category)}`);
    return new ListingService(
      this.pages,
      path,
      ($, root, url) => {
        const tables = extractTables($, root, url);
        return tableRows(visibleTables(tables)).map(({ table, row }) =>
          parseViolationRow(category, table, row),
        );
      },
      liferay.tablePortlet,
      (item) => item.id ?? JSON.stringify(item.fields),
    );
  }

  list<C extends ViolationCategory>(
    category: C,
    options: ListOptions = {},
  ): Promise<Listing<ViolationRecordMap[C]>> {
    return this.records(category).list(options);
  }

  async fairTradingDocuments(options: RequestOptions = {}): Promise<DocumentLink[]> {
    return (await this.index(options)).documents;
  }

  async detail<C extends ViolationDetailCategory>(
    category: C,
    idOrUrl: string,
    options: RequestOptions = {},
  ): Promise<ViolationDetailMap[C]> {
    if (!['food', 'veterinaryProducts'].includes(category))
      throw new ValidationError('This category publishes its details inline in the list');
    const page = await readRecordPage(this.pages, violationCategories[category], idOrUrl, options);
    return parseViolationDetail(category, page);
  }

  async get(url: string, options: RequestOptions = {}): Promise<ViolationDetail> {
    const path = new URL(url, this.pages.transport.baseUrl).pathname;
    const category = path.startsWith('/l/jogsertesek/')
      ? 'food'
      : path.startsWith('/l/allatgyogyaszati-termek-jogsertesek/')
        ? 'veterinaryProducts'
        : null;
    if (!category) throw new ValidationError('Supply a food or veterinary violation detail URL');
    return this.detail(category, url, options);
  }

  async *iterateDetails<C extends ViolationDetailCategory>(
    category: C,
    options: IterateOptions = {},
  ): AsyncGenerator<ViolationDetailMap[C]> {
    for await (const record of this.records(category).iterate(options)) {
      if (record.url) yield await this.detail(category, record.url, options);
    }
  }
}
