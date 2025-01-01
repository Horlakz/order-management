import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { ChatSendMessageDto } from './chat.dto';
import { WsAuthGuard } from './chat.guard';
import { ChatService } from './chat.service';

@UseGuards(WsAuthGuard)
@WebSocketGateway({ namespace: 'chat', cors: true })
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: ChatSendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).user;

    // Process the message (like saving and broadcasting)
    const message = await this.chatService.createChatMessage(
      userId,
      data.chatroomId,
      data.message,
    );

    // Broadcast the message to the chat room
    client.to(data.chatroomId).emit('message', message);
  }
}
