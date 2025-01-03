import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { HashUtils } from '@/lib/utilities/hash.utilities';
import { PrismaService } from '@/prisma/prisma.service';
import { clearDb } from './helper';

describe('UserController (Integration)', () => {
  let app: INestApplication;
  let db: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    db = app.get<PrismaService>(PrismaService);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    await clearDb(db);
  });

  describe('GET /user', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Seed a user and generate a token
      const user = await db.user.create({
        data: {
          email: 'user@example.com',
          password: await HashUtils.hash('Password123!'),
          firstName: 'John',
          lastName: 'Doe',
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'Password123!' });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should retrieve the authenticated user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('message', 'Success');
      expect(response.body.data).toHaveProperty('email', 'user@example.com');
    });

    it('should return 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get('/user').expect(401);
    });
  });
});
