import { liferay } from '../core/liferay.js';
import { routes } from '../routes.js';
import { readRecordPage } from './record-page.js';
import { parseAdditiveDetail } from '../parsers/details/additive.js';
import type { AdditiveDetail } from '../models/details.js';
import type { Additive, IterateOptions, RequestOptions } from '../types.js';
import { normalizeText } from '../parsers/dom.js';
import { extractTables } from '../parsers/tables.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';
import { selectTable } from '../parsers/table-selection.js';
import { rowContext } from '../parsers/table-records.js';

export class AdditivesService extends ListingService<Additive> {
  constructor(pages: PagesService) {
    super(
      pages,
      routes.additives,
      ($, root, url) => {
        const table = selectTable(extractTables($, root, url), ['E-szám', 'Név']);
        return (
          table?.rows.map((row) => {
            const context = rowContext(table, row);
            return {
              id: row.id,
              code: row.cells[0]?.text ?? '',
              name: row.cells[1]?.text ?? '',
              function: row.cells[2]?.text ?? '',
              adverseEffects: row.cells[3]?.text ?? '',
              url: context.url ?? context.links[0]?.url ?? null,
            };
          }) ?? []
        );
      },
      liferay.tablePortlet,
      (item) => item.id ?? item.code,
    );
  }

  async find(query: string, options: IterateOptions = {}): Promise<Additive[]> {
    const value = normalizeText(query).replace(/\s+/g, '');
    const result: Additive[] = [];
    for await (const item of this.iterate(options)) {
      if (
        normalizeText([item.code, item.name, item.function, item.adverseEffects].join(' '))
          .replace(/\s+/g, '')
          .includes(value)
      )
        result.push(item);
    }
    return result;
  }

  async get(idOrUrl: string, options: RequestOptions = {}): Promise<AdditiveDetail> {
    return parseAdditiveDetail(await readRecordPage(this.pages, this.path, idOrUrl, options));
  }
}
