import { liferay } from '../core/liferay.js';
import type { DataTable, Page, RequestOptions, TableRow } from '../types.js';
import { normalizeText } from '../parsers/dom.js';
import { extractTables } from '../parsers/tables.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';

export class TablesService extends ListingService<DataTable> {
  constructor(pages: PagesService, path: string) {
    super(pages, path, extractTables, liferay.tablePortlet);
  }

  async rows(
    options: RequestOptions & { query?: string; tableIndex?: number } = {},
  ): Promise<TableRow[]> {
    const listing = await this.list(options);
    const rows =
      options.tableIndex === undefined
        ? listing.items.flatMap((table) => table.rows)
        : (listing.items[options.tableIndex]?.rows ?? []);
    const query = normalizeText(options.query ?? '');
    return query
      ? rows.filter((row) => row.cells.some((cell) => normalizeText(cell.text).includes(query)))
      : rows;
  }

  page(options: RequestOptions = {}): Promise<Page> {
    return this.pages.get(this.path, options);
  }
}
