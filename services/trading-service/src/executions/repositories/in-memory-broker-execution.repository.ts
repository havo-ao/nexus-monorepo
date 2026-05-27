import { Injectable } from '@nestjs/common';
import { BrokerOrderExecution } from '../entities/broker-order-execution.entity';
import type {
  BrokerExecutionRepository,
  ExecutableOrder,
  SaveBrokerExecutionCommand,
} from './broker-execution.repository';

@Injectable()
export class InMemoryBrokerExecutionRepository implements BrokerExecutionRepository {
  private readonly orders = new Map<string, ExecutableOrder>([
    [
      'order-reference',
      {
        id: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      },
    ],
  ]);
  readonly executions: BrokerOrderExecution[] = [];

  findExecutableOrder(orderReference: string): Promise<ExecutableOrder | null> {
    return Promise.resolve(this.orders.get(orderReference) ?? null);
  }

  markOrderSentToBroker(
    command: SaveBrokerExecutionCommand,
  ): Promise<BrokerOrderExecution> {
    const updatedOrder: ExecutableOrder = {
      ...command.order,
      status: 'SENT_TO_BROKER',
    };
    this.orders.set(updatedOrder.orderReference, updatedOrder);

    const execution = new BrokerOrderExecution(
      updatedOrder.id,
      updatedOrder.orderReference,
      updatedOrder.traderId,
      updatedOrder.side,
      updatedOrder.orderType,
      updatedOrder.status,
      updatedOrder.symbol,
      updatedOrder.quantity,
      command.brokerResponse.externalOrderId,
      command.brokerResponse.brokerStatus,
      command.brokerResponse.brokerName,
      new Date().toISOString(),
    );
    this.executions.push(execution);

    return Promise.resolve(execution);
  }
}
