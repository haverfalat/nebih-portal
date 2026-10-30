import { liferay } from '../core/liferay.js';
import type { DatasetRecord, DatasetDetail } from '../models/datasets.js';
import { ValidationError } from '../core/errors.js';
import { datasets, type DatasetName } from '../datasets/index.js';
import type { ColumnDefinition } from '../datasets/schema.js';
import { fieldText } from '../parsers/fields.js';
import { extractTables } from '../parsers/tables.js';
import { headerIndex, rowContext, tableRows, visibleTables } from '../parsers/table-records.js';
import { columnValue } from '../parsers/column-values.js';
import { detailContext } from '../parsers/record-fields.js';
import { readRecordPage } from './record-page.js';
import type { Listing, ListOptions, RequestOptions } from '../types.js';
import { ListingService } from './listing.js';
import type { PagesService } from './pages.js';

export class DatasetsService {
  constructor(private readonly pages: PagesService) {}

  records<N extends DatasetName>(name: N): ListingService<DatasetRecord<N>> {
    const definition = datasets[name];
    if (!definition) throw new ValidationError(`Unknown dataset: ${String(name)}`);
    return new ListingService(
      this.pages,
      definition.path,
      ($, root, url) => {
        const tables = extractTables($, root, url);
        const columns = Object.entries(definition.columns);
        const candidates = visibleTables(tables).filter((table) =>
          columns.every(([, column]) => headerIndex(table, column.labels) >= 0),
        );
        return tableRows(candidates).map(({ table, row }) => {
          const values = Object.fromEntries(
            columns.map(([key, column]) => [
              key,
              columnValue(row.cells[headerIndex(table, column.labels)]?.text ?? null, column),
            ]),
          );
          return { ...values, ...rowContext(table, row) } as DatasetRecord<N>;
        });
      },
      liferay.tablePortlet,
      (item) => item.id ?? JSON.stringify(item.fields),
    );
  }

  list<N extends DatasetName>(
    name: N,
    options: ListOptions = {},
  ): Promise<Listing<DatasetRecord<N>>> {
    return this.records(name).list(options);
  }

  async detail<N extends DatasetName>(
    name: N,
    idOrUrl: string,
    options: RequestOptions = {},
  ): Promise<DatasetDetail<N>> {
    const definition = datasets[name];
    if (!definition) throw new ValidationError(`Unknown dataset: ${String(name)}`);
    const page = await readRecordPage(this.pages, definition.path, idOrUrl, options);
    const columns: Record<string, ColumnDefinition> = {
      ...definition.columns,
      ...definition.details,
    };
    const mapping = Object.fromEntries(
      Object.entries(columns).map(([key, column]) => [key, column.labels]),
    );
    const { fields, ...context } = detailContext(page, mapping);
    const values = Object.fromEntries(
      Object.entries(columns).map(([key, column]) => [
        key,
        columnValue(fieldText(fields, ...column.labels), column),
      ]),
    );
    return { ...values, ...context } as DatasetDetail<N>;
  }
}
