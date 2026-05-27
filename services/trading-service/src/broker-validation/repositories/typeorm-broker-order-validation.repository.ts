import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { OrderStatusEventEntity } from '../../orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { BrokerOrderValidationEvent } from '../entities/broker-order-validation-event.entity';
import { BrokerOrderValidation } from '../entities/broker-order-validation.entity';
import type {
  BrokerOrderValidationRepository,
  BrokerValidatableOrder,
  SaveBrokerOrderValidationCommand,
} from './broker-order-validation.repository';

@Injectable()
export class TypeOrmBrokerOrderValidationRepository implements BrokerOrderValidationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findOrderByReference(
    orderReference: string,
  ): Promise<BrokerValidatableOrder | null> {
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
    };
  }

  saveValidation(
    command: SaveBrokerOrderValidationCommand,
  ): Promise<BrokerOrderValidation> {
    return this.dataSource.transaction((manager) =>
      this.saveValidationInTransaction(manager, command),
    );
  }

  private async saveValidationInTransaction(
    manager: EntityManager,
    command: SaveBrokerOrderValidationCommand,
  ): Promise<BrokerOrderValidation> {
    const orderRepository = manager.getRepository(TradingOrderEntity);
    const validationRepository = manager.getRepository(
      BrokerOrderValidationEvent,
    );
    const statusEventRepository = manager.getRepository(OrderStatusEventEntity);

    const order = await orderRepository.findOneOrFail({
      where: { orderReference: command.order.orderReference },
      lock: { mode: 'pessimistic_write' },
    });
    const previousStatus = order.status;
    order.status = command.nextStatus;
    order.rejectionReason =
      command.decision === 'REJECT' ? command.reason : undefined;
    const savedOrder = await orderRepository.save(order);

    const validationEvent = new BrokerOrderValidationEvent();
    validationEvent.orderId = savedOrder.id;
    validationEvent.orderReference = savedOrder.orderReference;
    validationEvent.brokerId = command.brokerId;
    validationEvent.decision = command.decision;
    validationEvent.fromStatus = previousStatus;
    validationEvent.toStatus = savedOrder.status;
    validationEvent.reason = command.reason;
    const savedValidation = await validationRepository.save(validationEvent);

    const statusEvent = new OrderStatusEventEntity();
    statusEvent.orderId = savedOrder.id;
    statusEvent.orderReference = savedOrder.orderReference;
    statusEvent.fromStatus = previousStatus;
    statusEvent.toStatus = savedOrder.status;
    statusEvent.actorType = 'BROKER';
    statusEvent.actorId = command.brokerId;
    statusEvent.reason = command.reason;
    await statusEventRepository.save(statusEvent);

    return new BrokerOrderValidation(
      savedOrder.id,
      savedOrder.orderReference,
      command.brokerId,
      command.decision,
      savedOrder.status,
      command.reason,
      savedValidation.createdAt.toISOString(),
    );
  }
}
