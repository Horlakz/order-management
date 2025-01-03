import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { IsRole } from '@/lib/decorators/role';
import { User } from '@/lib/decorators/user';
import { PageableDto } from '@/lib/dto/dto';
import { BasePaginatedResponse, BaseResponse } from '@/lib/payload/response';
import { OrderCreateDto, OrderPageableDto } from './order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @IsRole('USER')
  @Post()
  async createOrder(@User('id') userId: string, @Body() body: OrderCreateDto) {
    return new BaseResponse(
      HttpStatus.OK,
      'Order created successfully',
      await this.orderService.createOrder(userId, body),
    );
  }

  @IsRole('ADMIN')
  @Get('all')
  async getAllOrders(@Query() query: OrderPageableDto) {
    const res = await this.orderService.getAllOrders(query);
    return new BasePaginatedResponse(
      HttpStatus.OK,
      'Orders fetched successfully',
      res.pagination,
      res.data,
    );
  }

  @IsRole('USER')
  @Get()
  async getUserOrders(@User('id') userId: string, @Query() query: PageableDto) {
    const res = await this.orderService.getAllOrders({ userId, ...query });
    return new BasePaginatedResponse(
      HttpStatus.OK,
      'Orders fetched successfully',
      res.pagination,
      res.data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @IsRole('ADMIN')
  @Post(':id/process')
  async processOrder(
    @User('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body('summary') summary: string,
  ) {
    return new BaseResponse(
      HttpStatus.OK,
      'Order processed successfully',
      await this.orderService.processOrder(userId, { orderId, summary }),
    );
  }

  @HttpCode(HttpStatus.OK)
  @IsRole('ADMIN')
  @Post(':id/complete')
  async completeOrder(
    @User('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return new BaseResponse(
      HttpStatus.OK,
      'Order completed successfully',
      await this.orderService.completeOrder(userId, orderId),
    );
  }
}
