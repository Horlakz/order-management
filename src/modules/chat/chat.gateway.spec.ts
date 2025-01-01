import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { ChatSendMessageDto } from './chat.dto';
import { ChatGateway } from './chat.gateway';
import { WsAuthGuard } from './chat.guard';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let chatGateway: ChatGateway;
  let chatService: ChatService;
  let socket: Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: {
            createChatMessage: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(WsAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    chatGateway = module.get<ChatGateway>(ChatGateway);
    chatService = module.get<ChatService>(ChatService);
    socket = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any as Socket;
  });

  it('should be defined', () => {
    expect(chatGateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should process and broadcast the message', async () => {
      const data: ChatSendMessageDto = {
        chatroomId: 'room1',
        message: 'Hello, World!',
      };
      const userId = 'user1';
      const message = { id: 'msg1', ...data, userId };

      (socket as any).user = userId;
      jest
        .spyOn(chatService, 'createChatMessage')
        .mockResolvedValue(message as any);

      await chatGateway.handleMessage(data, socket);

      expect(chatService.createChatMessage).toHaveBeenCalledWith(
        userId,
        data.chatroomId,
        data.message,
      );
      expect(socket.to).toHaveBeenCalledWith(data.chatroomId);
      expect(socket.emit).toHaveBeenCalledWith('message', message);
    });
  });
});
