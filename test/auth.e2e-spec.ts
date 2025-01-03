import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { clearDb } from './helper';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let cacheManager: Cache;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    db = app.get<PrismaService>(PrismaService);
    cacheManager = app.get<Cache>(CACHE_MANAGER);

    await app.init();
  });

  afterAll(async () => {
    await clearDb(db);

    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      await db.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER' },
      });

      const registerDto = {
        email: 'samijoh.johsam@gmail.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      expect(response.body).toHaveProperty('status', 2100);
      expect(response.body).toHaveProperty('message', 'Register successful');
      expect(response.body.data).toBeUndefined();

      const user = await db.user.findFirst({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(registerDto.email);
    });

    it('should return 400 if email is already registered', async () => {
      const registerDto = {
        email: 'samijoh.johsam@gmail.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email successfully', async () => {
      let verifyEmailDto = {
        email: 'samijoh.johsam@gmail.com',
        code: '123456',
      };

      const user = await db.user.findFirst({
        where: { email: verifyEmailDto.email },
      });

      const verificationCode = await cacheManager.get<string>(
        `verification-code:${user?.id}`,
      );
      verifyEmailDto.code = verificationCode;

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(verifyEmailDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', 2100);
      expect(response.body).toHaveProperty('message', 'Email verified');

      const updatedUser = await db.user.findFirst({
        where: { email: verifyEmailDto.email },
      });

      expect(updatedUser?.isEmailVerified).toBe(true);
    });

    it('should return 400 if verification code is incorrect', async () => {
      const verifyEmailDto = {
        email: 'samijoh.johsam@gmail.com',
        code: 'wrong-code',
      };

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(verifyEmailDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should log in a user and return tokens', async () => {
      const loginDto = {
        email: 'samijoh.johsam@gmail.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', 2100);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 if credentials are invalid', async () => {
      const loginDto = {
        email: 'samijoh.johsam@gmail.com',
        password: 'WrongPassword!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should initiate a password reset', async () => {
      const forgotPasswordDto = { email: 'samijoh.johsam@gmail.com' };

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', 2100);
      expect(response.body).toHaveProperty(
        'message',
        'Password reset code sent',
      );
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset the user password', async () => {
      let resetPasswordDto = {
        email: 'samijoh.johsam@gmail.com',
        password: 'NewPassword123!',
        code: 'valid-reset-token',
      };

      // Simulate a reset token in the database
      const user = await db.user.findFirst({
        where: { email: resetPasswordDto.email },
      });
      const verificationCode = await cacheManager.get<string>(
        `verification-code:${user?.id}`,
      );

      resetPasswordDto.code = verificationCode;

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetPasswordDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', 2100);
      expect(response.body).toHaveProperty(
        'message',
        'Password reset successful',
      );
    });
  });
});
