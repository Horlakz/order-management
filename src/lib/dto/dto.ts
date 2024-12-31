import { IsOptional } from 'class-validator';

export class PageableDto {
  @IsOptional()
  page: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  sortBy: string;

  @IsOptional()
  sortDir: string;
}
