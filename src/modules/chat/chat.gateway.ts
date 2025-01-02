import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';

import { WsUser } from '@/lib/decorators/user';
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

  @WebSocketServer()
  server: Server;

  async handleDisconnect(client: Socket) {
    const chatroomId = await this.cacheManager.get<string>(client.id);
    client.leave(chatroomId);
    this.cacheManager.del(client.id);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody('chatroomId', ParseUUIDPipe) chatroomId: string,
    @ConnectedSocket() client: Socket,
    @WsUser('id') userId: string,
  ) {
    client.join(chatroomId);
    this.cacheManager.set(client.id, chatroomId);

    const messages = await this.chatService.getChatsByChatRoomId(
      userId,
      chatroomId,
      { page: 1, limit: 10 },
    );

    // Send the messages to the client
    this.server.to(chatroomId).emit('messages', messages.data);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: ChatSendMessageDto,
    @ConnectedSocket() client: Socket,
    @WsUser('id') userId: string,
  ) {
    if ((await this.cacheManager.get<string>(client.id)) !== data.chatroomId) {
      throw new WsException('You are not part of this chat room');
    }

    // Process the message (like saving and broadcasting)
    const message = await this.chatService.createChatMessage(
      userId,
      data.chatroomId,
      data.message,
    );

    // Broadcast the message to the chat room
    this.server.to(data.chatroomId).emit('message', message);
  }
}
