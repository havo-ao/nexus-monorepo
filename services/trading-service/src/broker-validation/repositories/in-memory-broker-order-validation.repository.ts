import { Injectable } from '@nestjs/common';
import { BrokerOrderValidation } from '../entities/broker-order-validation.entity';
import type {
  BrokerOrderValidationRepository,
  BrokerValidatableOrder,
  SaveBrokerOrderValidationCommand,
} from './broker-order-validation.repository';

@Injectable()
export class InMemoryBrokerOrderValidationRepository implements BrokerOrderValidationRepository {
  private readonly orders = new Map<string, BrokerValidatableOrder>([
    [
      'order-reference',
      {
        id: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
      },
    ],
    [
      'broker-rejected-order-reference',
      {
        id: '2',
        orderReference: 'broker-rejected-order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
      },
    ],
  ]);
  readonly validations: BrokerOrderValidation[] = [];

  findOrderByReference(
    orderReference: string,
  ): Promise<BrokerValidatableOrder | null> {
    return Promise.resolve(this.orders.get(orderReference) ?? null);
  }

  saveValidation(
    command: SaveBrokerOrderValidationCommand,
  ): Promise<BrokerOrderValidation> {
    const updatedOrder: BrokerValidatableOrder = {
      ...command.order,
      status: command.nextStatus,
    };
    this.orders.set(updatedOrder.orderReference, updatedOrder);

    const validation = new BrokerOrderValidation(
      updatedOrder.id,
      updatedOrder.orderReference,
      command.brokerId,
      command.decision,
      updatedOrder.status,
      command.reason,
      new Date().toISOString(),
    );
    this.validations.push(validation);

    return Promise.resolve(validation);
  }
}
