import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { roundMoney } from '../../common/money';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { PendingOrderProcessingEvent } from '../entities/pending-order-processing-event.entity';
import type {
  MarkReadyForExecutionCommand,
  PendingOrderEvaluationCommand,
  PendingOrderRepository,
  ProcessableOrder,
} from './pending-order.repository';

@Injectable()
export class TypeOrmPendingOrderRepository implements PendingOrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findProcessableOrders(limit: number): Promise<ProcessableOrder[]> {
    const orders = await this.dataSource
      .getRepository(TradingOrderEntity)
      .find({
        where: {
          status: In(['PENDING_MARKET_OPEN', 'PENDING_CONDITION']),
        },
        order: { createdAt: 'ASC' },
        take: limit,
      });

    return orders.map((order) => this.toProcessableOrder(order));
  }

  recordEvaluation(command: PendingOrderEvaluationCommand): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(PendingOrderProcessingEvent)
        .save(this.toProcessingEvent(command));
    });
  }

  markReadyForExecution(
    command: MarkReadyForExecutionCommand,
  ): Promise<ProcessableOrder> {
    return this.dataSource.transaction((manager) =>
      this.markReadyInTransaction(manager, command),
    );
  }

  private async markReadyInTransaction(
    manager: EntityManager,
    command: MarkReadyForExecutionCommand,
  ): Promise<ProcessableOrder> {
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const order = await orderRepository.findOneOrFail({
      where: { orderReference: command.order.orderReference },
      lock: { mode: 'pessimistic_write' },
    });

    const previousStatus = order.status;
    if (
      previousStatus !== 'PENDING_MARKET_OPEN' &&
      previousStatus !== 'PENDING_CONDITION'
    ) {
      await manager.getRepository(PendingOrderProcessingEvent).save(
        this.toProcessingEvent({
          ...command,
          matched: false,
          action: 'SKIPPED_FINAL_STATE',
          reason: `Order cannot be processed from status ${previousStatus}`,
          nextStatus: undefined,
        }),
      );
      return this.toProcessableOrder(order);
    }

    order.status = command.nextStatus;
    if (command.marketPrice) {
      order.estimatedUnitPrice = this.toDecimal(command.marketPrice);
      order.grossAmount = this.toDecimal(
        roundMoney(Number(order.quantity) * command.marketPrice),
      );
    }
    const savedOrder = await orderRepository.save(order);

    const statusEvent = new OrderStatusEventEntity();
    statusEvent.orderId = savedOrder.id;
    statusEvent.orderReference = savedOrder.orderReference;
    statusEvent.fromStatus = previousStatus;
    statusEvent.toStatus = savedOrder.status;
    statusEvent.actorType = 'SYSTEM';
    statusEvent.actorId = 'pending-order-processor';
    statusEvent.reason = command.reason;
    await manager.getRepository(OrderStatusEventEntity).save(statusEvent);

    await manager.getRepository(PendingOrderProcessingEvent).save(
      this.toProcessingEvent({
        ...command,
        order: { ...command.order, status: previousStatus },
      }),
    );

    return this.toProcessableOrder(savedOrder);
  }

  private toProcessingEvent(
    command: PendingOrderEvaluationCommand,
  ): PendingOrderProcessingEvent {
    const event = new PendingOrderProcessingEvent();
    event.orderId = command.order.id;
    event.orderReference = command.order.orderReference;
    event.fromStatus = command.order.status;
    event.toStatus = command.nextStatus;
    event.symbol = command.order.symbol;
    event.orderType = command.order.orderType;
    event.marketStatus = command.marketStatus;
    event.marketPrice =
      command.marketPrice === undefined
        ? undefined
        : this.toDecimal(command.marketPrice);
    event.triggerPrice =
      command.triggerPrice === undefined
        ? undefined
        : this.toDecimal(command.triggerPrice);
    event.matched = command.matched;
    event.action = command.action;
    event.reason = command.reason;
    event.evaluatedAt = command.evaluatedAt;
    return event;
  }

  private toProcessableOrder(order: TradingOrderEntity): ProcessableOrder {
    return {
      id: order.id,
      orderReference: order.orderReference,
      traderId: order.traderId,
      side: order.side,
      orderType: order.orderType,
      status: order.status,
      symbol: order.symbol,
      exchangeId: order.exchangeId,
      quantity: Number(order.quantity),
      estimatedUnitPrice: Number(order.estimatedUnitPrice),
      grossAmount: Number(order.grossAmount),
      currency: order.currency,
      limitPrice: order.limitPrice ? Number(order.limitPrice) : undefined,
    };
  }

  private toDecimal(value: number): string {
    return roundMoney(value).toFixed(2);
  }
}
