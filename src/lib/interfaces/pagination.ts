export interface IPageable {
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: string;
}

export interface IPagination {
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface IBasePaginatedResponse<T> {
  status: number;
  message: string;
  results: { data: T; pagination: IPagination };
}
