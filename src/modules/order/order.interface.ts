import { ORDER_STATUS } from '@/lib/constants/order-status';

export interface IOrderCreate {
  description: string;
  specifications: string;
  quantity: number;
}

export interface IOrderProcess {
  orderId: string;
  summary: string;
}

export interface IOrderStatusUpdate {
  userId: string;
  orderId: string;
  status: keyof typeof ORDER_STATUS;
}

export type IOrderStatusHistoryCreate = IOrderStatusUpdate;
