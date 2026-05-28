import { Injectable } from '@nestjs/common';
import { roundMoney } from '../../common/money';
import type {
  MarkReadyForExecutionCommand,
  PendingOrderEvaluationCommand,
  PendingOrderRepository,
  ProcessableOrder,
} from './pending-order.repository';

@Injectable()
export class InMemoryPendingOrderRepository implements PendingOrderRepository {
  readonly orders: ProcessableOrder[] = [
    {
      id: '1',
      orderReference: 'queued-market-order-reference',
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      status: 'PENDING_MARKET_OPEN',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 1,
      estimatedUnitPrice: 250,
      grossAmount: 250,
      currency: 'USD',
    },
    {
      id: '2',
      orderReference: 'pending-limit-order-reference',
      traderId: '101',
      side: 'BUY',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 1,
      estimatedUnitPrice: 250,
      grossAmount: 250,
      currency: 'USD',
      limitPrice: 255,
    },
  ];

  readonly events: PendingOrderEvaluationCommand[] = [];

  findProcessableOrders(limit: number): Promise<ProcessableOrder[]> {
    return Promise.resolve(
      this.orders
        .filter((order) =>
          ['PENDING_MARKET_OPEN', 'PENDING_CONDITION'].includes(order.status),
        )
        .slice(0, limit),
    );
  }

  recordEvaluation(command: PendingOrderEvaluationCommand): Promise<void> {
    this.events.push(command);
    return Promise.resolve();
  }

  markReadyForExecution(
    command: MarkReadyForExecutionCommand,
  ): Promise<ProcessableOrder> {
    const order = this.orders.find(
      (candidate) => candidate.orderReference === command.order.orderReference,
    );

    if (!order) {
      throw new Error('Order was not found');
    }

    const previousStatus = order.status;
    order.status = command.nextStatus;
    if (command.marketPrice) {
      order.estimatedUnitPrice = roundMoney(command.marketPrice);
      order.grossAmount = roundMoney(order.quantity * command.marketPrice);
    }

    this.events.push({
      ...command,
      order: { ...command.order, status: previousStatus },
    });

    return Promise.resolve(order);
  }
}
