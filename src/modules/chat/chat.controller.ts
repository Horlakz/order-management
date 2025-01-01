import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { User } from '@/lib/decorators/user';
import { PageableDto } from '@/lib/dto/dto';
import { BasePaginatedResponse, BaseResponse } from '@/lib/payload/response';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':chatroomId')
  async getChatsByChatRoomId(
    @User('id') userId: string,
    @Param('chatroomId', ParseUUIDPipe) chatRoomId: string,
    @Query() pageable: PageableDto,
  ) {
    const res = await this.chatService.getChatsByChatRoomId(
      userId,
      chatRoomId,
      pageable,
    );

    return new BasePaginatedResponse(
      HttpStatus.OK,
      'Chats fetched successfully',
      res.pagination,
      res.data,
    );
  }

  @Post(':chatroomId')
  async sendMessage(
    @User('id') userId: string,
    @Param('chatroomId', ParseUUIDPipe) chatRoomId: string,
    @Body('message') message: string,
  ) {
    return new BaseResponse(
      HttpStatus.CREATED,
      'Message sent successfully',
      await this.chatService.createChatMessage(userId, chatRoomId, message),
    );
  }

  @Post(':chatroomId/join')
  async joinChatRoom(
    @User('id') userId: string,
    @Param('chatroomId', ParseUUIDPipe) chatRoomId: string,
  ) {
    return new BaseResponse(
      HttpStatus.OK,
      'Chatroom joined successfully',
      await this.chatService.joinChatRoom(userId, chatRoomId),
    );
  }
}
