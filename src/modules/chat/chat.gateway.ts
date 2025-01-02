import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';

import { ChatSendMessageDto } from './chat.dto';
import { WsAuthGuard } from './chat.guard';
import { ChatService } from './chat.service';

@UseGuards(WsAuthGuard)
@WebSocketGateway({ namespace: 'order-chat', cors: true })
export class ChatGateway {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly chatService: ChatService,
  ) {}

  async handleDisconnect(client: Socket) {
    const chatroomId = await this.cacheManager.get<string>(client.id);
    client.leave(chatroomId);
    this.cacheManager.del(client.id);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody('chatroomId', ParseUUIDPipe) chatroomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(chatroomId);
    this.cacheManager.set(client.id, chatroomId);

    const userId = (client as any).user;

    const messages = await this.chatService.getChatsByChatRoomId(
      userId,
      chatroomId,
      { page: 1, limit: 10 },
    );

    // Send the messages to the client
    client.to(chatroomId).emit('messages', messages.data);
  }

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
