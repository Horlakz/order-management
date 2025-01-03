import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { HashUtils } from '@/lib/utilities/hash.utilities';
import { PrismaService } from '@/prisma/prisma.service';
import { clearDb } from './helper';

describe('ChatModule (Integration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let accessToken: string;
  let chatRoomId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    db = app.get<PrismaService>(PrismaService);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    const role = await db.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER' },
    });

    const user = await db.user.create({
      data: {
        email: 'user@example.com',
        password: await HashUtils.hash('Password123!'),
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        userRole: { create: { role: { connect: { id: role.id } } } },
      },
    });

    const reviewStatus = await db.orderStatus.upsert({
      where: { name: 'REVIEW' },
      update: {},
      create: { name: 'REVIEW' },
    });

    const chatRoom = await db.chatRoom.create({
      data: {
        order: {
          create: {
            description: 'Test Order',
            specifications: 'Test Specifications',
            quantity: 10,
            user: { connect: { id: user.id } },
            status: { connect: { id: reviewStatus.id } },
          },
        },
        status: 'OPEN',
      },
    });

    await db.chatRoomParticipant.create({
      data: {
        userId: user.id,
        chatRoomId: chatRoom.id,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'Password123!' });

    accessToken = loginResponse.body.data.accessToken;
    chatRoomId = chatRoom.id;
  });

  afterAll(async () => {
    await clearDb(db);
    await app.close();
  });

  describe('GET /chat/:chatroomId', () => {
    it('should fetch chats from the chat room', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/${chatRoomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty(
        'message',
        'Chats fetched successfully',
      );
    });

    it('should return 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get(`/chat/${chatRoomId}`).expect(401);
    });

    it('should return 403 if user is not part of the chat room', async () => {
      const role = await db.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER' },
      });
      await db.user.create({
        data: {
          email: 'other@example.com',
          password: await HashUtils.hash('Password123!'),
          firstName: 'Other',
          lastName: 'User',
          isEmailVerified: true,
          userRole: { create: { role: { connect: { id: role.id } } } },
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'other@example.com', password: 'Password123!' });

      const token = loginResponse.body.data.accessToken;

      await request(app.getHttpServer())
        .get(`/chat/${chatRoomId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /chat/:chatroomId', () => {
    it('should send a message to the chat room', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/${chatRoomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Hello, World!' })
        .expect(201);

      expect(response.body).toHaveProperty('status', 201);
      expect(response.body).toHaveProperty(
        'message',
        'Message sent successfully',
      );
      expect(response.body.data).toHaveProperty('message', 'Hello, World!');
    });

    it('should return 400 if message is empty', async () => {
      await request(app.getHttpServer())
        .post(`/chat/${chatRoomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: '' })
        .expect(400);
    });

    it('should return 403 if user is not part of the chat room', async () => {
      const role = await db.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER' },
      });

      await db.user.create({
        data: {
          email: 'otheruser@example.com',
          password: await HashUtils.hash('Password123!'),
          firstName: 'Other',
          lastName: 'User',
          isEmailVerified: true,
          userRole: { create: { role: { connect: { id: role.id } } } },
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'otheruser@example.com', password: 'Password123!' });

      const token = loginResponse.body.data.accessToken;

      await request(app.getHttpServer())
        .post(`/chat/${chatRoomId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Unauthorized message' })
        .expect(403);
    });
  });

  describe('POST /chat/:chatroomId/join', () => {
    it('should allow admin to join a chat room', async () => {
      const role = await db.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN' },
      });

      await db.user.create({
        data: {
          email: 'admin@example.com',
          password: await HashUtils.hash('Password123!'),
          firstName: 'Admin',
          lastName: 'User',
          isEmailVerified: true,
          userRole: { create: { role: { connect: { id: role.id } } } },
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'Password123!' });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app.getHttpServer())
        .post(`/chat/${chatRoomId}/join`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty(
        'message',
        'Chatroom joined successfully',
      );
    });

    it('should return 403 if a non-admin tries to join a chat room', async () => {
      await request(app.getHttpServer())
        .post(`/chat/${chatRoomId}/join`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });
});
