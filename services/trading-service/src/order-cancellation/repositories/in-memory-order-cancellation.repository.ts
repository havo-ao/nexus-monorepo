import { Injectable } from '@nestjs/common';
import { OrderCancellation } from '../entities/order-cancellation.entity';
import type {
  CancelOrderCommand,
  CancelOrderResult,
  OrderCancellationRepository,
} from './order-cancellation.repository';

type InMemoryCancellableOrder = {
  id: string;
  orderReference: string;
  status: 'CREATED' | 'PENDING_EXECUTION' | 'PENDING_CONDITION' | 'CANCELLED';
  reservedAmount: number;
};

@Injectable()
export class InMemoryOrderCancellationRepository implements OrderCancellationRepository {
  private readonly orders = new Map<string, InMemoryCancellableOrder>([
    [
      'order-reference',
      {
        id: '1',
        orderReference: 'order-reference',
        status: 'PENDING_EXECUTION',
        reservedAmount: 250,
      },
    ],
  ]);

  cancelOrder(command: CancelOrderCommand): Promise<CancelOrderResult> {
    const order = this.orders.get(command.orderReference);

    if (!order) {
      return Promise.resolve({
        cancelled: false,
        reason: 'Order was not found',
      });
    }

    if (order.status === 'CANCELLED') {
      return Promise.resolve({
        cancelled: false,
        reason: 'Order cannot be cancelled from status CANCELLED',
      });
    }

    const previousStatus = order.status;
    const releasedAmount = order.reservedAmount;
    order.status = 'CANCELLED';
    order.reservedAmount = 0;

    return Promise.resolve({
      cancelled: true,
      cancellation: new OrderCancellation(
        order.id,
        order.orderReference,
        previousStatus,
        'CANCELLED',
        releasedAmount,
        command.reason,
      ),
    });
  }
}
