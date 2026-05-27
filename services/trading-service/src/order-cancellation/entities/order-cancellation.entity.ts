import type { OrderStatus } from '../../orders/entities/trading-order.entity';

export class OrderCancellation {
  constructor(
    readonly orderId: string,
    readonly orderReference: string,
    readonly previousStatus: OrderStatus,
    readonly currentStatus: OrderStatus,
    readonly releasedAmount: number,
    readonly reason: string,
  ) {}
}
