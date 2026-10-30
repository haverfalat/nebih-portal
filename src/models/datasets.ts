import type { datasets, DatasetName } from '../datasets/index.js';
import type { ColumnValues } from '../datasets/schema.js';
import type { ContentField, Link, Page, TableRow } from '../types.js';

type Definition<N extends DatasetName> = (typeof datasets)[N];

export type DatasetRecord<N extends DatasetName> = ColumnValues<Definition<N>['columns']> & {
  id: string | null;
  url: string | null;
  links: Link[];
  fields: Array<{ label: string; value: string }>;
  row: TableRow;
};

export type DatasetDetail<N extends DatasetName> = ColumnValues<Definition<N>['columns']> &
  ColumnValues<Definition<N>['details']> & {
    id: string | null;
    url: string;
    sections: ContentField[];
    unmappedFields: ContentField[];
    page: Page;
  };
