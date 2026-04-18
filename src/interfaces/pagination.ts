// Generic pagination response interface
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Pagination query parameters interface
export interface PaginationQueryParams {
  page: number;
  pageSize: number;
  search?: string;
}
