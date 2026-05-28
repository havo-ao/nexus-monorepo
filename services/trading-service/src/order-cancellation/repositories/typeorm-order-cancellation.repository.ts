import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { roundMoney } from '../../common/money';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import type { OrderStatus } from '../../orders/entities/trading-order.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { OrderCancellation } from '../entities/order-cancellation.entity';
import type {
  CancelOrderCommand,
  CancelOrderResult,
  OrderCancellationRepository,
} from './order-cancellation.repository';

const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'CREATED',
  'PENDING_EXECUTION',
  'PENDING_CONDITION',
];

@Injectable()
export class TypeOrmOrderCancellationRepository implements OrderCancellationRepository {
  constructor(private readonly dataSource: DataSource) {}

  cancelOrder(command: CancelOrderCommand): Promise<CancelOrderResult> {
    return this.dataSource.transaction((manager) =>
      this.cancelOrderInTransaction(manager, command),
    );
  }

  private async cancelOrderInTransaction(
    manager: EntityManager,
    command: CancelOrderCommand,
  ): Promise<CancelOrderResult> {
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const statusEventRepository = manager.getRepository(OrderStatusEventEntity);
    const walletRepository = manager.getRepository(Wallet);

    const order = await orderRepository.findOne({
      where: { orderReference: command.orderReference },
      lock: { mode: 'pessimistic_write' },
    });

    if (!order) {
      return {
        cancelled: false,
        reason: 'Order was not found',
      };
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return {
        cancelled: false,
        reason: `Order cannot be cancelled from status ${order.status}`,
      };
    }

    const previousStatus = order.status;
    const releasedAmount = roundMoney(Number(order.reservedAmount));

    if (order.side === 'BUY' && releasedAmount > 0) {
      const wallet = await walletRepository.findOne({
        where: { traderId: order.traderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (wallet) {
        wallet.availableBalance = this.toDecimal(
          Number(wallet.availableBalance) + releasedAmount,
        );
        wallet.reservedBalance = this.toDecimal(
          Math.max(Number(wallet.reservedBalance) - releasedAmount, 0),
        );
        await walletRepository.save(wallet);
      }
    }

    order.status = 'CANCELLED';
    order.reservedAmount = this.toDecimal(0);
    const savedOrder = await orderRepository.save(order);

    const statusEvent = new OrderStatusEventEntity();
    statusEvent.orderId = savedOrder.id;
    statusEvent.orderReference = savedOrder.orderReference;
    statusEvent.fromStatus = previousStatus;
    statusEvent.toStatus = 'CANCELLED';
    statusEvent.actorType = 'TRADER';
    statusEvent.actorId = command.actorId;
    statusEvent.reason = command.reason;
    await statusEventRepository.save(statusEvent);

    return {
      cancelled: true,
      cancellation: new OrderCancellation(
        savedOrder.id,
        savedOrder.orderReference,
        previousStatus,
        'CANCELLED',
        releasedAmount,
        command.reason,
      ),
    };
  }

  private toDecimal(value: number): string {
    return roundMoney(value).toFixed(2);
  }
}
