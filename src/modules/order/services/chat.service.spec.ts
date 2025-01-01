import { ROLE } from '@/lib/constants/roles';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatRoomStatus } from '@prisma/client';
import { ChatService } from './chat.service';
import { OrderService } from './order.service';

describe('ChatService', () => {
  let chatService: ChatService;
  let prismaService: PrismaService;
  let orderService: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: {
            chatMessage: {
              count: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            chatRoom: {
              findUnique: jest.fn(),
            },
            chatRoomParticipant: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: OrderService,
          useValue: {
            userHasRole: jest.fn(),
          },
        },
      ],
    }).compile();

    chatService = module.get<ChatService>(ChatService);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<OrderService>(OrderService);
  });

  describe('getChatsByChatRoomId', () => {
    it('should return paginated chat messages', async () => {
      const userId = 'user1';
      const chatRoomId = 'chatRoom1';
      const pageable = { page: 1, limit: 10 };
      const chatMessages = [
        {
          id: '1',
          message: 'Hello',
          createdAt: new Date(),
          user: {
            id: 'user1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      jest
        .spyOn(chatService, 'checkIfUserIsPartOfChatRoom')
        .mockResolvedValueOnce(undefined);
      jest.spyOn(prismaService.chatMessage, 'count').mockResolvedValueOnce(1);
      jest
        .spyOn(prismaService.chatMessage, 'findMany')
        .mockResolvedValueOnce(chatMessages as any);

      const result = await chatService.getChatsByChatRoomId(
        userId,
        chatRoomId,
        pageable,
      );

      expect(result).toEqual({
        data: chatMessages,
        pagination: {
          currentPage: 1,
          totalItems: 1,
          totalPages: 1,
        },
      });
      expect(prismaService.chatMessage.count).toHaveBeenCalledWith({
        where: { chatRoomId },
      });
      expect(prismaService.chatMessage.findMany).toHaveBeenCalledWith({
        where: { chatRoomId },
        skip: 0,
        take: 10,
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
    });
  });

  describe('createChatMessage', () => {
    it('should create a chat message', async () => {
      const userId = 'user1';
      const chatRoomId = 'chatRoom1';
      const message = 'Hello';

      jest
        .spyOn(chatService, 'checkIfUserIsPartOfChatRoom')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(chatService, 'checkIfChatRoomIsOpen')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(prismaService.chatMessage, 'create')
        .mockResolvedValueOnce(undefined);

      await chatService.createChatMessage(userId, chatRoomId, message);

      expect(prismaService.chatMessage.create).toHaveBeenCalledWith({
        data: {
          message,
          user: { connect: { id: userId } },
          chatRoom: { connect: { id: chatRoomId } },
        },
      });
    });
  });

  describe('joinChatRoom', () => {
    it('should allow admin to join chat room', async () => {
      const userId = 'admin1';
      const chatRoomId = 'chatRoom1';

      jest.spyOn(orderService, 'userHasRole').mockResolvedValueOnce(true);
      jest
        .spyOn(prismaService.chatRoomParticipant, 'create')
        .mockResolvedValueOnce(undefined);

      await chatService.joinChatRoom(userId, chatRoomId);

      expect(orderService.userHasRole).toHaveBeenCalledWith(userId, ROLE.ADMIN);
      expect(prismaService.chatRoomParticipant.create).toHaveBeenCalledWith({
        data: {
          userId,
          chatRoomId,
        },
      });
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const userId = 'user1';
      const chatRoomId = 'chatRoom1';

      jest.spyOn(orderService, 'userHasRole').mockResolvedValueOnce(false);

      await expect(
        chatService.joinChatRoom(userId, chatRoomId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkIfUserIsPartOfChatRoom', () => {
    it('should throw NotFoundException if chat room does not exist', async () => {
      const userId = 'user1';
      const chatRoomId = 'chatRoom1';

      jest
        .spyOn(prismaService.chatRoom, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(
        chatService.checkIfUserIsPartOfChatRoom(userId, chatRoomId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not part of chat room', async () => {
      const userId = 'user1';
      const chatRoomId = 'chatRoom1';

      jest.spyOn(prismaService.chatRoom, 'findUnique').mockResolvedValueOnce({
        id: chatRoomId,
        status: ChatRoomStatus.OPEN,
      } as any);
      jest
        .spyOn(prismaService.chatRoomParticipant, 'findFirst')
        .mockResolvedValueOnce(null);

      await expect(
        chatService.checkIfUserIsPartOfChatRoom(userId, chatRoomId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkIfChatRoomIsOpen', () => {
    it('should throw BadRequestException if chat room is closed', async () => {
      const chatRoomId = 'chatRoom1';

      jest.spyOn(prismaService.chatRoom, 'findUnique').mockResolvedValueOnce({
        id: chatRoomId,
        status: ChatRoomStatus.CLOSED,
      } as any);

      await expect(
        chatService.checkIfChatRoomIsOpen(chatRoomId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
