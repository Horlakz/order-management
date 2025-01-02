import { PrismaService } from '@/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';
import { ChatSendMessageDto } from './chat.dto';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let chatGateway: ChatGateway;
  let cacheManager: Cache;
  let chatService: ChatService;
  let client: Socket;
  let server: Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ChatService,
          useValue: {
            getChatsByChatRoomId: jest.fn(),
            createChatMessage: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            chatMessage: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    chatGateway = module.get<ChatGateway>(ChatGateway);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    chatService = module.get<ChatService>(ChatService);
    client = {
      id: 'client-id',
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Socket;
    server = new Server();
    jest.spyOn(server, 'to').mockReturnThis();
    chatGateway.server = server;
  });

  it('should handle disconnect', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue('chatroom-id');
    await chatGateway.handleDisconnect(client);
    expect(cacheManager.get).toHaveBeenCalledWith(client.id);
    expect(client.leave).toHaveBeenCalledWith('chatroom-id');
    expect(cacheManager.del).toHaveBeenCalledWith(client.id);
  });

  it('should handle join', async () => {
    const chatroomId = 'chatroom-id';
    const userId = 'user-id';

    const messages = {
      data: [
        {
          id: 'message1-id',
          message: 'message1',
          createdAt: new Date(),
          user: {
            id: 'user1-id',
            email: 'user1@example.com',
            firstName: 'User',
            lastName: 'One',
          },
        },
        {
          id: 'message2-id',
          message: 'message2',
          createdAt: new Date(),
          user: {
            id: 'user2-id',
            email: 'user2@example.com',
            firstName: 'User',
            lastName: 'Two',
          },
        },
      ],
      pagination: {
        currentPage: 1,
        totalItems: 2,
        totalPages: 1,
      },
    };

    jest.spyOn(chatService, 'getChatsByChatRoomId').mockResolvedValue(messages);

    await chatGateway.handleJoin(chatroomId, client, userId);

    expect(client.join).toHaveBeenCalledWith(chatroomId);
    expect(cacheManager.set).toHaveBeenCalledWith(client.id, chatroomId);
    expect(chatService.getChatsByChatRoomId).toHaveBeenCalledWith(
      userId,
      chatroomId,
      { page: 1, limit: 10 },
    );
    expect(server.to).toHaveBeenCalledWith(chatroomId);
  });

  it('should handle message', async () => {
    const data: ChatSendMessageDto = {
      chatroomId: 'chatroom-id',
      message: 'Hello',
    };
    const userId = 'user-id';
    const message = {
      id: 'message2-id',
      message: 'message2',
      createdAt: new Date(),
      user: {
        id: 'user2-id',
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
      },
    };

    jest
      .spyOn(chatService, 'createChatMessage')
      .mockResolvedValue(message as any);
    jest.spyOn(cacheManager, 'get').mockResolvedValue(data.chatroomId);

    await chatGateway.handleMessage(data, client, userId);

    expect(chatService.createChatMessage).toHaveBeenCalledWith(
      userId,
      data.chatroomId,
      data.message,
    );
    expect(server.to).toHaveBeenCalledWith(data.chatroomId);
  });
});
