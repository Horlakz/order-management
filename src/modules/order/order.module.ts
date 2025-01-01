import { Module } from '@nestjs/common';

import { ChatController } from './controllers/chat.controller';
import { OrderController } from './controllers/order.controller';
import { ChatService } from './services/chat.service';
import { OrderService } from './services/order.service';

@Module({
  controllers: [OrderController, ChatController],
  providers: [OrderService, ChatService],
})
export class OrderModule {}
