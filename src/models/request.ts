export interface RequestOptions {
  signal?: AbortSignal;
  fresh?: boolean;
}

export interface ListOptions extends RequestOptions {
  page?: number;
  pageSize?: number;
}

export interface IterateOptions extends ListOptions {
  maxPages?: number;
}

export interface SearchOptions extends ListOptions {
  scope?: 'this-site' | 'everything';
}
