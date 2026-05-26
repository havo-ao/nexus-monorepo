import type { OrderStatusActorType } from '../../orders/entities/order-status-event.entity';
import type { OrderStatus } from '../../orders/entities/trading-order.entity';

export class OrderStatusHistoryEntry {
  constructor(
    readonly id: string,
    readonly orderId: string,
    readonly orderReference: string,
    readonly toStatus: OrderStatus,
    readonly actorType: OrderStatusActorType,
    readonly actorId: string,
    readonly reason: string,
    readonly createdAt: string,
    readonly fromStatus?: OrderStatus,
  ) {}
}
