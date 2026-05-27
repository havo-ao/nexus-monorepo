import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { roundMoney } from '../../common/money';
import { BrokerExecutionEvent } from '../../executions/entities/broker-execution-event.entity';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import type { OrderStatus } from '../../orders/entities/trading-order.entity';
import { OrderSettlement } from '../entities/order-settlement.entity';
import { OrderSettlementEvent } from '../entities/order-settlement-event.entity';
import { TradingNotificationEvent } from '../entities/trading-notification-event.entity';
import type {
  OrderSettlementRepository,
  SettleBrokerStatusCommand,
  SettlementContext,
} from './order-settlement.repository';

@Injectable()
export class TypeOrmOrderSettlementRepository implements OrderSettlementRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findSettlementContext(
    orderReference: string,
  ): Promise<SettlementContext | null> {
    const order = await this.dataSource
      .getRepository(TradingOrderEntity)
      .findOne({ where: { orderReference } });

    if (!order) {
      return null;
    }

    const execution = await this.dataSource
      .getRepository(BrokerExecutionEvent)
      .findOne({
        where: { orderReference },
        order: { createdAt: 'DESC' },
      });

    if (!execution) {
      return null;
    }

    return {
      order: {
        id: order.id,
        orderReference: order.orderReference,
        traderId: order.traderId,
        side: order.side,
        orderType: order.orderType,
        status: order.status,
        symbol: order.symbol,
        stockId: order.stockId,
        quantity: Number(order.quantity),
        estimatedUnitPrice: Number(order.estimatedUnitPrice),
        grossAmount: Number(order.grossAmount),
        reservedAmount: Number(order.reservedAmount),
        currency: order.currency,
      },
      execution: {
        brokerName: execution.brokerName,
        externalOrderId: execution.externalOrderId,
        brokerStatus: execution.brokerStatus,
      },
    };
  }

  settleBrokerStatus(
    command: SettleBrokerStatusCommand,
  ): Promise<OrderSettlement> {
    return this.dataSource.transaction((manager) =>
      this.settleInTransaction(manager, command),
    );
  }

  private async settleInTransaction(
    manager: EntityManager,
    command: SettleBrokerStatusCommand,
  ): Promise<OrderSettlement> {
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const settlementRepository = manager.getRepository(OrderSettlementEvent);
    const statusEventRepository = manager.getRepository(OrderStatusEventEntity);
    const notificationRepository = manager.getRepository(
      TradingNotificationEvent,
    );

    const order = await orderRepository.findOneOrFail({
      where: { orderReference: command.context.order.orderReference },
      lock: { mode: 'pessimistic_write' },
    });
    const previousStatus = order.status;
    const filledQuantity = this.resolveFilledQuantity(command);
    const averageFilledPrice =
      command.brokerStatus.averageFilledPrice ??
      Number(order.estimatedUnitPrice);
    const settledAmount = roundMoney(filledQuantity * averageFilledPrice);
    const commissionAmount = command.commissionAmount;
    const netAmount = this.resolveNetAmount(
      order.side,
      settledAmount,
      commissionAmount,
    );
    order.status = command.nextStatus;
    if (
      command.nextStatus !== 'EXECUTED' &&
      command.nextStatus !== previousStatus
    ) {
      order.rejectionReason = command.reason;
    }
    const savedOrder = await orderRepository.save(order);

    await settlementRepository.save(
      this.toSettlementEvent({
        command,
        internalStatus: savedOrder.status,
        filledQuantity,
        averageFilledPrice,
        settledAmount,
        commissionAmount,
        netAmount,
      }),
    );

    if (previousStatus !== savedOrder.status) {
      await statusEventRepository.save(
        this.toStatusEvent(
          savedOrder,
          previousStatus,
          command.nextStatus,
          command.actorId,
          command.reason,
        ),
      );
    }

    await notificationRepository.save(
      this.toNotificationEvent(command, savedOrder.orderReference),
    );

    return new OrderSettlement(
      savedOrder.id,
      savedOrder.orderReference,
      savedOrder.traderId,
      savedOrder.side,
      savedOrder.status,
      savedOrder.symbol,
      Number(savedOrder.quantity),
      filledQuantity,
      averageFilledPrice,
      settledAmount,
      commissionAmount,
      netAmount,
      savedOrder.currency,
      command.brokerStatus.brokerName,
      command.brokerStatus.externalOrderId,
      command.brokerStatus.brokerStatus,
      command.portfolioUpdated,
      command.fundsUpdated,
      command.notification.delivered,
      new Date().toISOString(),
    );
  }

  private resolveFilledQuantity(command: SettleBrokerStatusCommand): number {
    return command.brokerStatus.filledQuantity > 0
      ? command.brokerStatus.filledQuantity
      : command.context.order.quantity;
  }

  private resolveNetAmount(
    side: string,
    settledAmount: number,
    commissionAmount: number,
  ): number {
    return side === 'BUY'
      ? roundMoney(settledAmount + commissionAmount)
      : roundMoney(settledAmount - commissionAmount);
  }

  private toSettlementEvent(input: {
    command: SettleBrokerStatusCommand;
    internalStatus: OrderStatus;
    filledQuantity: number;
    averageFilledPrice: number;
    settledAmount: number;
    commissionAmount: number;
    netAmount: number;
  }): OrderSettlementEvent {
    const event = new OrderSettlementEvent();
    event.orderId = input.command.context.order.id;
    event.orderReference = input.command.context.order.orderReference;
    event.brokerName = input.command.brokerStatus.brokerName;
    event.externalOrderId = input.command.brokerStatus.externalOrderId;
    event.brokerStatus = input.command.brokerStatus.brokerStatus;
    event.internalStatus = input.internalStatus;
    event.filledQuantity = input.filledQuantity.toFixed(6);
    event.averageFilledPrice = this.toDecimal(input.averageFilledPrice);
    event.settledAmount = this.toDecimal(input.settledAmount);
    event.commissionAmount = this.toDecimal(input.commissionAmount);
    event.netAmount = this.toDecimal(input.netAmount);
    event.currency = input.command.context.order.currency;
    event.reason = input.command.reason;
    return event;
  }

  private toStatusEvent(
    order: TradingOrderEntity,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    actorId: string,
    reason: string,
  ): OrderStatusEventEntity {
    const event = new OrderStatusEventEntity();
    event.orderId = order.id;
    event.orderReference = order.orderReference;
    event.fromStatus = fromStatus;
    event.toStatus = toStatus;
    event.actorType = 'BROKER';
    event.actorId = actorId;
    event.reason = reason;
    return event;
  }

  private toNotificationEvent(
    command: SettleBrokerStatusCommand,
    orderReference: string,
  ): TradingNotificationEvent {
    const event = new TradingNotificationEvent();
    event.orderReference = orderReference;
    event.notificationType = 'ORDER_EXECUTED';
    event.recipientEmail = command.notification.recipientEmail;
    event.delivered = command.notification.delivered;
    event.reason = command.notification.reason;
    return event;
  }

  private toDecimal(value: number): string {
    return roundMoney(value).toFixed(2);
  }
}
