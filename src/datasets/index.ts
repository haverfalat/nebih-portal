import { animalDatasets } from './animal.js';
import { foodDatasets } from './food.js';
import { generalDatasets } from './general.js';
import { plantDatasets } from './plant.js';

export const datasets = {
  ...animalDatasets,
  ...foodDatasets,
  ...generalDatasets,
  ...plantDatasets,
} as const;
export type DatasetName = keyof typeof datasets;
export type { ColumnDefinition, ColumnKind, ColumnValue, ColumnValues } from './schema.js';
