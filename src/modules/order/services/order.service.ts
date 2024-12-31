import { ORDER_STATUS } from '@/lib/constants/order-status';
import { ROLE } from '@/lib/constants/roles';
import { IPageable, IPagination } from '@/lib/interfaces/pagination';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ChatRoomStatus } from '@prisma/client';
import {
  IOrderCreate,
  IOrderProcess,
  IOrderStatusHistoryCreate,
  IOrderStatusUpdate,
} from '../order.interface';

@Injectable()
export class OrderService {
  constructor(private readonly db: PrismaService) {}

  async createOrder(userId: string, data: IOrderCreate) {
    const adminUser = await this.db.userRole.findFirst({
      where: { role: { name: ROLE.ADMIN } },
      select: { user: true },
    });

    const order = await this.db.order.create({
      data: {
        description: data.description,
        specifications: data.specifications,
        quantity: data.quantity,
        status: { connect: { name: ORDER_STATUS.REVIEW } },
        user: { connect: { id: userId } },
        chatRoom: {
          create: {
            chatRoomParticipant: {
              createMany: {
                data: [{ userId: adminUser.user.id }, { userId: userId }],
              },
            },
          },
        },
      },
      include: { status: true },
    });

    await this.createdOrderStatusHistory({
      userId,
      orderId: order.id,
      status: order.status.name as 'REVIEW',
    });
  }

  async getAllOrders(pageable: IPageable & { userId: string }) {
    const { page, limit, sortBy, sortDir, userId } = pageable;

    let where = {};

    if (this.userHasRole(userId, ROLE.USER)) {
      where = { userId: userId };
    }

    const totalItems = await this.db.order.count({ where });
    const totalPages = Math.ceil(totalItems / +limit);
    const currentPage = Math.min(+page, totalPages);

    const orders = await this.db.order.findMany({
      where,
      skip: (currentPage - 1) * +limit,
      take: +limit,
      orderBy: { [sortBy ?? 'createdAt']: sortDir ?? 'desc' },
      select: {
        id: true,
        description: true,
        quantity: true,
        status: { select: { name: true } },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        chatRoom: { select: { id: true } },
      },
    });

    return {
      data: orders,
      pagination: {
        currentPage,
        totalItems,
        totalPages,
      } satisfies IPagination,
    };
  }

  async getOrder(orderId: string) {
    return await this.db.order.findUnique({
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
  }

  async processOrder(userId: string, data: IOrderProcess) {
    if (!this.userHasRole(userId, ROLE.ADMIN)) {
      throw new ForbiddenException('Only admin can process order');
    }

    await this.updateOrderStatus({
      userId,
      orderId: data.orderId,
      status: ORDER_STATUS.PROCESSING as 'PROCESSING',
    });

    const order = await this.getOrder(data.orderId);

    await this.db.chatRoom.update({
      where: { id: order.chatRoom.id },
      data: { status: ChatRoomStatus.CLOSED, summary: data.summary },
    });
  }

  async completeOrder(userId: string, orderId: string) {
    if (!this.userHasRole(userId, ROLE.ADMIN)) {
      throw new ForbiddenException('Only admin can complete order');
    }

    await this.updateOrderStatus({
      userId,
      orderId,
      status: ORDER_STATUS.COMPLETED as 'COMPLETED',
    });
  }

  async updateOrderStatus(data: IOrderStatusUpdate) {
    const order = await this.getOrder(data.orderId);

    const currentStatus = order.status.name as keyof typeof ORDER_STATUS;
    const newStatus = data.status as keyof typeof ORDER_STATUS;

    const statusHierarchy = [
      ORDER_STATUS.REVIEW,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.COMPLETED,
    ];

    const currentStatusIndex = statusHierarchy.indexOf(currentStatus);
    const newStatusIndex = statusHierarchy.indexOf(newStatus);

    if (newStatusIndex <= currentStatusIndex) {
      throw new BadRequestException(
        'Invalid status update. Cannot jump stages or go back.',
      );
    }

    await this.db.order.update({
      where: { id: data.orderId },
      data: {
        status: { connect: { name: data.status } },
      },
    });

    await this.createdOrderStatusHistory(data);
  }

  async createdOrderStatusHistory(data: IOrderStatusHistoryCreate) {
    await this.db.orderStatusHistory.create({
      data: {
        status: { connect: { name: data.status } },
        createdBy: { connect: { id: data.userId } },
        order: { connect: { id: data.orderId } },
      },
    });
  }

  async userHasRole(userId: string, roleName: string) {
    const user = this.db.userRole.findFirst({
      where: { userId, role: { name: roleName } },
    });

    return !!user;
  }
}
