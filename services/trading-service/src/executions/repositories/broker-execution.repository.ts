import type { BrokerOrderResponse } from '../clients/external-broker.client';
import type { BrokerOrderExecution } from '../entities/broker-order-execution.entity';
import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../orders/entities/trading-order.entity';

export const BROKER_EXECUTION_REPOSITORY = Symbol(
  'BROKER_EXECUTION_REPOSITORY',
);

export type ExecutableOrder = {
  id: string;
  orderReference: string;
  traderId: string;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  symbol: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency: string;
};

export type SaveBrokerExecutionCommand = {
  order: ExecutableOrder;
  brokerResponse: BrokerOrderResponse;
};

export type SaveBrokerExecutionFailureCommand = {
  order: ExecutableOrder;
  brokerName: string;
  brokerStatus: string;
  requestSummary: string;
  failureReason: string;
};

export interface BrokerExecutionRepository {
  findExecutableOrder(orderReference: string): Promise<ExecutableOrder | null>;

  markOrderSentToBroker(
    command: SaveBrokerExecutionCommand,
  ): Promise<BrokerOrderExecution>;

  markOrderFailedByBroker(
    command: SaveBrokerExecutionFailureCommand,
  ): Promise<BrokerOrderExecution>;
}
