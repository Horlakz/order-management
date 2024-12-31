import { IBaseResponse } from '../interfaces/interface';
import { IBasePaginatedResponse, IPagination } from '../interfaces/pagination';

class BaseResponse<T = unknown> implements IBaseResponse<T> {
  status: number;
  message: string;
  data?: T;

  constructor(status: number, message: string, data?: T) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

class BasePaginatedResponse<T = unknown> implements IBasePaginatedResponse<T> {
  status: number;
  message: string;
  results: { data: T; pagination: IPagination };

  constructor(
    status: number,
    message: string,
    pagination: IPagination,
    data: T,
  ) {
    this.status = status;
    this.message = message;
    this.results = { data, pagination };
  }
}

export { BasePaginatedResponse, BaseResponse };
