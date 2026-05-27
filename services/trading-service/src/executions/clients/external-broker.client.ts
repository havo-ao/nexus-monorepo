import type {
  OrderSide,
  OrderType,
} from '../../orders/entities/trading-order.entity';

export const EXTERNAL_BROKER_CLIENT = Symbol('EXTERNAL_BROKER_CLIENT');

export type SendBrokerOrderCommand = {
  orderReference: string;
  side: OrderSide;
  orderType: OrderType;
  symbol: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency: string;
};

export type BrokerOrderResponse = {
  brokerName: string;
  externalOrderId: string;
  brokerStatus: string;
  requestSummary: string;
  responseSummary: string;
};

export interface ExternalBrokerClient {
  sendOrder(command: SendBrokerOrderCommand): Promise<BrokerOrderResponse>;
}
