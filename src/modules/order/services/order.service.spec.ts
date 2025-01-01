import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ORDER_STATUS } from '@/lib/constants/order-status';
import { ROLE } from '@/lib/constants/roles';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: {
            userRole: {
              findFirst: jest.fn(),
            },
            order: {
              create: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            chatRoom: {
              update: jest.fn(),
            },
            orderStatusHistory: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const userId = 'user-id';
      const data = {
        description: 'Test order',
        specifications: 'Test specifications',
        quantity: 1,
      };
      const adminUser = { user: { id: 'admin-id' } };
      const createdOrder = {
        id: 'order-id',
        status: { name: ORDER_STATUS.REVIEW },
      };

      jest
        .spyOn(prismaService.userRole, 'findFirst')
        .mockResolvedValue(adminUser as any);
      jest
        .spyOn(prismaService.order, 'create')
        .mockResolvedValue(createdOrder as any);
      jest
        .spyOn(service, 'createdOrderStatusHistory')
        .mockResolvedValue(undefined);

      await service.createOrder(userId, data);

      expect(prismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: { role: { name: ROLE.ADMIN } },
        select: { user: true },
      });
      expect(prismaService.order.create).toHaveBeenCalled();
      expect(service.createdOrderStatusHistory).toHaveBeenCalledWith({
        userId,
        orderId: createdOrder.id,
        status: ORDER_STATUS.REVIEW,
      });
    });
  });

  describe('getAllOrders', () => {
    it('should return paginated orders', async () => {
      const pageable = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
        userId: 'user-id',
      };
      const orders = [{ id: 'order-id', description: 'Test order' }];
      const totalItems = 1;

      jest.spyOn(prismaService.order, 'count').mockResolvedValue(totalItems);
      jest
        .spyOn(prismaService.order, 'findMany')
        .mockResolvedValue(orders as any);
      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);

      const result = await service.getAllOrders(pageable);

      expect(prismaService.order.count).toHaveBeenCalled();
      expect(prismaService.order.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        data: orders,
        pagination: {
          currentPage: 1,
          totalItems,
          totalPages: 1,
        },
      });
    });
  });

  describe('getOrder', () => {
    it('should return an order by id', async () => {
      const orderId = 'order-id';
      const order = { id: orderId, description: 'Test order' };

      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(order as any);

      const result = await service.getOrder(orderId);

      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        select: {
          description: true,
          specifications: true,
          quantity: true,
          status: { select: { name: true } },
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          chatRoom: { select: { id: true } },
        },
      });
      expect(result).toEqual(order);
    });
  });

  describe('processOrder', () => {
    it('should process an order', async () => {
      const userId = 'admin-id';
      const data = { orderId: 'order-id', summary: 'Order summary' };
      const order = { chatRoom: { id: 'chat-room-id' } };

      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);
      jest.spyOn(service, 'updateOrderStatus').mockResolvedValue(undefined);
      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);
      jest.spyOn(prismaService.chatRoom, 'update').mockResolvedValue(undefined);

      await service.processOrder(userId, data);

      expect(service.userHasRole).toHaveBeenCalledWith(userId, ROLE.ADMIN);
      expect(service.updateOrderStatus).toHaveBeenCalledWith({
        userId,
        orderId: data.orderId,
        status: ORDER_STATUS.PROCESSING,
      });
      expect(service.getOrder).toHaveBeenCalledWith(data.orderId);
      expect(prismaService.chatRoom.update).toHaveBeenCalledWith({
        where: { id: order.chatRoom.id },
        data: { status: 'CLOSED', summary: data.summary },
      });
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const userId = 'user-id';
      const data = { orderId: 'order-id', summary: 'Order summary' };
      const order = {
        chatRoom: { id: 'chat-room-id' },
        status: { name: 'REVIEW' },
      };

      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);
      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);

      await expect(service.processOrder(userId, data)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('completeOrder', () => {
    it('should complete an order', async () => {
      const userId = 'admin-id';
      const orderId = 'order-id';

      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);
      jest.spyOn(service, 'updateOrderStatus').mockResolvedValue(undefined);

      await service.completeOrder(userId, orderId);

      expect(service.userHasRole).toHaveBeenCalledWith(userId, ROLE.ADMIN);
      expect(service.updateOrderStatus).toHaveBeenCalledWith({
        userId,
        orderId,
        status: ORDER_STATUS.COMPLETED,
      });
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      const userId = 'user-id';
      const orderId = 'order-id';
      const order = { status: { name: ORDER_STATUS.PROCESSING } };

      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);
      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);

      await expect(service.completeOrder(userId, orderId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const data = {
        userId: 'user-id',
        orderId: 'order-id',
        status: ORDER_STATUS.PROCESSING as 'PROCESSING',
      };
      const order = { status: { name: ORDER_STATUS.REVIEW } };

      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue(undefined);
      jest
        .spyOn(service, 'createdOrderStatusHistory')
        .mockResolvedValue(undefined);

      await service.updateOrderStatus(data);

      expect(service.getOrder).toHaveBeenCalledWith(data.orderId);
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: data.orderId },
        data: {
          status: { connect: { name: data.status } },
        },
      });
      expect(service.createdOrderStatusHistory).toHaveBeenCalledWith(data);
    });

    it('should throw BadRequestException for invalid status update', async () => {
      const data = {
        userId: 'user-id',
        orderId: 'order-id',
        status: ORDER_STATUS.REVIEW as 'REVIEW',
      };
      const order = { status: { name: ORDER_STATUS.PROCESSING } };

      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);

      await expect(service.updateOrderStatus(data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createdOrderStatusHistory', () => {
    it('should create order status history', async () => {
      const data = {
        userId: 'user-id',
        orderId: 'order-id',
        status: ORDER_STATUS.REVIEW as 'REVIEW',
      };

      jest
        .spyOn(prismaService.orderStatusHistory, 'create')
        .mockResolvedValue(undefined);

      await service.createdOrderStatusHistory(data);

      expect(prismaService.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          status: { connect: { name: data.status } },
          createdBy: { connect: { id: data.userId } },
          order: { connect: { id: data.orderId } },
        },
      });
    });
  });

  describe('userHasRole', () => {
    it('should return true if user has role', async () => {
      const userId = 'user-id';
      const roleName = ROLE.ADMIN;
      const userRole = { userId, role: { name: roleName } };

      jest
        .spyOn(prismaService.userRole, 'findFirst')
        .mockResolvedValue(userRole as any);

      const result = await service.userHasRole(userId, roleName);

      expect(prismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: { userId, role: { name: roleName } },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not have a role', async () => {
      const userId = 'user-id';
      const roleName = ROLE.ADMIN;

      jest.spyOn(prismaService.userRole, 'findFirst').mockResolvedValue(null);

      const result = await service.userHasRole(userId, roleName);

      expect(prismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: { userId, role: { name: roleName } },
      });
      expect(result).toBe(false);
    });
  });
});
