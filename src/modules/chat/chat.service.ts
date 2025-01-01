import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRoomStatus } from '@prisma/client';

import { ROLE } from '@/lib/constants/roles';
import { IPageable, IPagination } from '@/lib/interfaces/pagination';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly db: PrismaService) {}

  async getChatsByChatRoomId(
    userId: string,
    chatRoomId: string,
    pageable: IPageable,
  ) {
    this.checkIfUserIsPartOfChatRoom(userId, chatRoomId);

    const { page, limit } = pageable;

    const totalItems = await this.db.chatMessage.count({
      where: { chatRoomId },
    });
    const totalPages = Math.ceil(totalItems / +limit);
    const currentPage = Math.min(+page, totalPages);

    const data = await this.db.chatMessage.findMany({
      where: { chatRoomId },
      skip: (currentPage - 1) * +limit,
      take: +limit,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      data,
      pagination: { currentPage, totalItems, totalPages } satisfies IPagination,
    };
  }

  async createChatMessage(userId: string, chatRoomId: string, message: string) {
    this.checkIfUserIsPartOfChatRoom(userId, chatRoomId);
    this.checkIfChatRoomIsOpen(chatRoomId);

    return await this.db.chatMessage.create({
      data: {
        message,
        user: { connect: { id: userId } },
        chatRoom: { connect: { id: chatRoomId } },
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async joinChatRoom(userId: string, chatRoomId: string) {
    if (!(await this.userHasRole(userId, ROLE.ADMIN))) {
      throw new ForbiddenException('only admin can join chat room');
    }

    await this.db.chatRoomParticipant.create({
      data: {
        userId,
        chatRoomId,
      },
    });
  }

  async checkIfUserIsPartOfChatRoom(userId: string, chatRoomId: string) {
    const chatRoom = await this.db.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!chatRoom) {
      throw new NotFoundException('Chat room does not exist');
    }

    const chatRoomParticipants = await this.db.chatRoomParticipant.findFirst({
      where: { chatRoomId, userId },
    });

    if (!chatRoomParticipants) {
      throw new ForbiddenException('User is not part of the chat room');
    }
  }

  async checkIfChatRoomIsOpen(chatRoomId: string) {
    const chatRoom = await this.db.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (chatRoom.status !== ChatRoomStatus.OPEN) {
      throw new BadRequestException('Chat room is closed');
    }
  }

  async userHasRole(userId: string, roleName: string) {
    const user = await this.db.userRole.findFirst({
      where: { userId, role: { name: roleName } },
    });

    return !!user;
  }
}
