import { liferay } from '../core/liferay.js';
import { routes } from '../routes.js';
import { readRecordPage } from './record-page.js';
import { parseRecallDetail } from '../parsers/details/recall.js';
import type { RecallDetail } from '../models/details.js';
import type { Recall, RequestOptions } from '../types.js';
import { parseDate } from '../parsers/dom.js';
import { extractTables } from '../parsers/tables.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';
import { selectTable } from '../parsers/table-selection.js';
import { rowContext } from '../parsers/table-records.js';

export class RecallsService extends ListingService<Recall> {
  constructor(pages: PagesService) {
    super(
      pages,
      routes.recalls,
      ($, root, url) => {
        const table = selectTable(extractTables($, root, url), ['Termék neve', 'Probléma jellege']);
        return (
          table?.rows.map((row) => {
            const context = rowContext(table, row);
            return {
              id: row.id,
              date: parseDate(row.cells[0]?.text),
              dateLabel: row.cells[0]?.text ?? '',
              product: row.cells[1]?.text ?? '',
              reason: row.cells[2]?.text ?? '',
              url: context.url ?? context.links[0]?.url ?? null,
              cells: row.cells,
            };
          }) ?? []
        );
      },
      liferay.tablePortlet,
      (item) => item.id ?? item.url ?? `${item.dateLabel}:${item.product}`,
    );
  }

  async get(idOrUrl: string, options: RequestOptions = {}): Promise<RecallDetail> {
    return parseRecallDetail(await readRecordPage(this.pages, this.path, idOrUrl, options));
  }
}
