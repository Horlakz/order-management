import { PageableDto } from '@/lib/dto/dto';
import { IsNotEmpty, IsPositive, IsString, IsUUID } from 'class-validator';
import { IOrderCreate } from './order.interface';

export class OrderCreateDto implements IOrderCreate {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  specifications: string;

  @IsNotEmpty()
  @IsPositive()
  quantity: number;
}

export class OrderPageableDto extends PageableDto {
  @IsUUID()
  userId: string;
}
