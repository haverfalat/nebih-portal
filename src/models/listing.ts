export interface Pagination {
  currentPage: number;
  pageSize: number | null;
  totalPages: number | null;
  totalItems: number | null;
  nextUrl: string | null;
  previousUrl: string | null;
  pageParameter: string | null;
  pageSizeParameter: string | null;
  templateUrl: string | null;
}

export interface Listing<T> {
  url: string;
  items: T[];
  pagination: Pagination | null;
}
