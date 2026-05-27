import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { BrokerOrderExecution } from '../entities/broker-order-execution.entity';
import { BrokerExecutionEvent } from '../entities/broker-execution-event.entity';
import type {
  BrokerExecutionRepository,
  ExecutableOrder,
  SaveBrokerExecutionCommand,
  SaveBrokerExecutionFailureCommand,
} from './broker-execution.repository';

@Injectable()
export class TypeOrmBrokerExecutionRepository implements BrokerExecutionRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findExecutableOrder(
    orderReference: string,
  ): Promise<ExecutableOrder | null> {
    const order = await this.dataSource
      .getRepository(TradingOrderEntity)
      .findOne({ where: { orderReference } });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      orderReference: order.orderReference,
      traderId: order.traderId,
      side: order.side,
      orderType: order.orderType,
      status: order.status,
      symbol: order.symbol,
      quantity: Number(order.quantity),
      estimatedUnitPrice: Number(order.estimatedUnitPrice),
      currency: order.currency,
    };
  }

  markOrderSentToBroker(
    command: SaveBrokerExecutionCommand,
  ): Promise<BrokerOrderExecution> {
    return this.dataSource.transaction((manager) =>
      this.markSentInTransaction(manager, command),
    );
  }

  markOrderFailedByBroker(
    command: SaveBrokerExecutionFailureCommand,
  ): Promise<BrokerOrderExecution> {
    return this.dataSource.transaction((manager) =>
      this.markFailedInTransaction(manager, command),
    );
  }

  private async markSentInTransaction(
    manager: EntityManager,
    command: SaveBrokerExecutionCommand,
  ): Promise<BrokerOrderExecution> {
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const eventRepository = manager.getRepository(BrokerExecutionEvent);
    const statusEventRepository = manager.getRepository(OrderStatusEventEntity);

    const order = await orderRepository.findOneOrFail({
      where: { orderReference: command.order.orderReference },
      lock: { mode: 'pessimistic_write' },
    });
    const previousStatus = order.status;
    order.status = 'SENT_TO_BROKER';
    const savedOrder = await orderRepository.save(order);

    const brokerEvent = new BrokerExecutionEvent();
    brokerEvent.orderId = savedOrder.id;
    brokerEvent.orderReference = savedOrder.orderReference;
    brokerEvent.brokerName = command.brokerResponse.brokerName;
    brokerEvent.externalOrderId = command.brokerResponse.externalOrderId;
    brokerEvent.brokerStatus = command.brokerResponse.brokerStatus;
    brokerEvent.requestSummary = command.brokerResponse.requestSummary;
    brokerEvent.responseSummary = command.brokerResponse.responseSummary;
    const savedEvent = await eventRepository.save(brokerEvent);

    const statusEvent = new OrderStatusEventEntity();
    statusEvent.orderId = savedOrder.id;
    statusEvent.orderReference = savedOrder.orderReference;
    statusEvent.fromStatus = previousStatus;
    statusEvent.toStatus = savedOrder.status;
    statusEvent.actorType = 'BROKER';
    statusEvent.actorId = command.brokerResponse.brokerName;
    statusEvent.reason = `Order sent to broker ${command.brokerResponse.brokerName}`;
    await statusEventRepository.save(statusEvent);

    return new BrokerOrderExecution(
      savedOrder.id,
      savedOrder.orderReference,
      savedOrder.traderId,
      savedOrder.side,
      savedOrder.orderType,
      savedOrder.status,
      savedOrder.symbol,
      Number(savedOrder.quantity),
      savedEvent.externalOrderId,
      savedEvent.brokerStatus,
      savedEvent.brokerName,
      savedEvent.createdAt.toISOString(),
    );
  }

  private async markFailedInTransaction(
    manager: EntityManager,
    command: SaveBrokerExecutionFailureCommand,
  ): Promise<BrokerOrderExecution> {
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const eventRepository = manager.getRepository(BrokerExecutionEvent);
    const statusEventRepository = manager.getRepository(OrderStatusEventEntity);

    const order = await orderRepository.findOneOrFail({
      where: { orderReference: command.order.orderReference },
      lock: { mode: 'pessimistic_write' },
    });
    const previousStatus = order.status;
    order.status = 'FAILED';
    order.rejectionReason = command.failureReason;
    const savedOrder = await orderRepository.save(order);

    const brokerEvent = new BrokerExecutionEvent();
    brokerEvent.orderId = savedOrder.id;
    brokerEvent.orderReference = savedOrder.orderReference;
    brokerEvent.brokerName = command.brokerName;
    brokerEvent.externalOrderId = 'unavailable';
    brokerEvent.brokerStatus = command.brokerStatus;
    brokerEvent.requestSummary = command.requestSummary;
    brokerEvent.responseSummary = command.failureReason;
    const savedEvent = await eventRepository.save(brokerEvent);

    const statusEvent = new OrderStatusEventEntity();
    statusEvent.orderId = savedOrder.id;
    statusEvent.orderReference = savedOrder.orderReference;
    statusEvent.fromStatus = previousStatus;
    statusEvent.toStatus = savedOrder.status;
    statusEvent.actorType = 'BROKER';
    statusEvent.actorId = command.brokerName;
    statusEvent.reason = command.failureReason;
    await statusEventRepository.save(statusEvent);

    return new BrokerOrderExecution(
      savedOrder.id,
      savedOrder.orderReference,
      savedOrder.traderId,
      savedOrder.side,
      savedOrder.orderType,
      savedOrder.status,
      savedOrder.symbol,
      Number(savedOrder.quantity),
      savedEvent.externalOrderId,
      savedEvent.brokerStatus,
      savedEvent.brokerName,
      savedEvent.createdAt.toISOString(),
    );
  }
}
