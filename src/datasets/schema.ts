export type ColumnKind = 'text' | 'number' | 'date' | 'boolean';
export interface ColumnDefinition<K extends ColumnKind = ColumnKind> {
  kind: K;
  labels: readonly string[];
}

export const text = (...labels: string[]): ColumnDefinition<'text'> => ({ kind: 'text', labels });
export const number = (...labels: string[]): ColumnDefinition<'number'> => ({
  kind: 'number',
  labels,
});
export const date = (...labels: string[]): ColumnDefinition<'date'> => ({ kind: 'date', labels });
export const boolean = (...labels: string[]): ColumnDefinition<'boolean'> => ({
  kind: 'boolean',
  labels,
});

export function dataset<
  C extends Record<string, ColumnDefinition>,
  D extends Record<string, ColumnDefinition> = Record<never, never>,
>(path: string, columns: C, details?: D) {
  return { path, columns, details: (details ?? {}) as D };
}

export type ColumnValue<C extends ColumnDefinition> = C['kind'] extends 'number'
  ? number | null
  : C['kind'] extends 'boolean'
    ? boolean | null
    : string | null;
export type ColumnValues<C extends Record<string, ColumnDefinition>> = {
  [K in keyof C]: ColumnValue<C[K]>;
};
