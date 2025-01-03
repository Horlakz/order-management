import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { clearDb, getAuthToken } from './helper';

describe('OrderModule (integration)', () => {
  let app: INestApplication;
  let db: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    db = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDb(db);
  });

  describe('POST /order (createOrder)', () => {
    it('should create an order as USER', async () => {
      const orderData = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 10,
      };

      const authToken = await getAuthToken(db);

      const response = await request(app.getHttpServer())
        .post('/order')
        .set('Authorization', `Bearer ${authToken.user}`)
        .send(orderData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.message).toBe('Order created successfully');
    });

    it('should return a forbidden error for non-USER role', async () => {
      const orderData = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 10,
      };

      const authToken = await getAuthToken(db);

      const response = await request(app.getHttpServer())
        .post('/order')
        .set('Authorization', `Bearer ${authToken.admin}`)
        .send(orderData);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe('Forbidden resource');
    });
  });

  describe('GET /order (getUserOrders)', () => {
    it('should get user orders', async () => {
      const authToken = await getAuthToken(db);

      const response = await request(app.getHttpServer())
        .get('/order')
        .set('Authorization', `Bearer ${authToken.user}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.message).toBe('Orders fetched successfully');
    });

    it('should return a forbidden error for non-USER role', async () => {
      const authToken = await getAuthToken(db);

      const response = await request(app.getHttpServer())
        .get('/order')
        .set('Authorization', `Bearer ${authToken.admin}`);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe('Forbidden resource');
    });
  });

  describe('POST /order/:id/process (processOrder)', () => {
    it('should process an order as ADMIN', async () => {
      const orderData = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 10,
      };

      const authToken = await getAuthToken(db);

      // Create an order
      await request(app.getHttpServer())
        .post('/order')
        .set('Authorization', `Bearer ${authToken.user}`)
        .send(orderData);

      // get all orders
      const getOrderResponse = await request(app.getHttpServer())
        .get('/order')
        .set('Authorization', `Bearer ${authToken.user}`);

      const orderId = getOrderResponse.body.results.data[0].id;

      const processData = { summary: 'Order processed' };

      const response = await request(app.getHttpServer())
        .post(`/order/${orderId}/process`)
        .set('Authorization', `Bearer ${authToken.admin}`)
        .send(processData);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.message).toBe('Order processed successfully');
    });

    it('should return a forbidden error for non-ADMIN role', async () => {
      const orderData = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 10,
      };

      const authToken = await getAuthToken(db);

      // Create an order
      await request(app.getHttpServer())
        .post('/order')
        .set('Authorization', `Bearer ${authToken.user}`)
        .send(orderData);

      // get all orders
      const getOrderResponse = await request(app.getHttpServer())
        .get('/order')
        .set('Authorization', `Bearer ${authToken.user}`);

      const orderId = getOrderResponse.body.results.data[0].id;
      const processData = { summary: 'Order processed' };

      const response = await request(app.getHttpServer())
        .post(`/order/${orderId}/process`)
        .set('Authorization', `Bearer ${authToken.user}`)
        .send(processData);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe('Forbidden resource');
    });
  });

  describe('POST /order/:id/complete (completeOrder)', () => {
    it('should complete an order as ADMIN', async () => {
      const orderData = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 10,
      };

      const authToken = await getAuthToken(db);

      // Create an order
      await request(app.getHttpServer())
        .post('/order')
        .set('Authorization', `Bearer ${authToken.user}`)
        .send(orderData);

      // get all orders
      const getOrderResponse = await request(app.getHttpServer())
        .get('/order')
        .set('Authorization', `Bearer ${authToken.user}`);

      const orderId = getOrderResponse.body.results.data[0].id;

      const response = await request(app.getHttpServer())
        .post(`/order/${orderId}/complete`)
        .set('Authorization', `Bearer ${authToken.admin}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.message).toBe('Order completed successfully');
    });

    it('should return a forbidden error for non-ADMIN role', async () => {
      const orderData = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 10,
      };

      const authToken = await getAuthToken(db);

      // Create an order
      await request(app.getHttpServer())
        .post('/order')
        .set('Authorization', `Bearer ${authToken.user}`)
        .send(orderData);

      // get all orders
      const getOrderResponse = await request(app.getHttpServer())
        .get('/order')
        .set('Authorization', `Bearer ${authToken.user}`);

      const orderId = getOrderResponse.body.results.data[0].id;

      const response = await request(app.getHttpServer())
        .post(`/order/${orderId}/complete`)
        .set('Authorization', `Bearer ${authToken.user}`);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe('Forbidden resource');
    });
  });
});
