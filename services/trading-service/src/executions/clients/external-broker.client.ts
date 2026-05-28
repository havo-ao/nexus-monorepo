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
  limitPrice?: number;
  currency: string;
};

export type BrokerOrderResponse = {
  brokerName: string;
  externalOrderId: string;
  brokerStatus: string;
  requestSummary: string;
  responseSummary: string;
};

export type BrokerOrderStatusResponse = {
  brokerName: string;
  externalOrderId: string;
  brokerStatus: string;
  filledQuantity: number;
  averageFilledPrice?: number;
  responseSummary: string;
};

export interface ExternalBrokerClient {
  sendOrder(command: SendBrokerOrderCommand): Promise<BrokerOrderResponse>;
  getOrderStatus(externalOrderId: string): Promise<BrokerOrderStatusResponse>;
}

export class BrokerOrderSubmissionError extends Error {
  constructor(
    readonly brokerName: string,
    readonly brokerStatus: string,
    readonly requestSummary: string,
    message: string,
  ) {
    super(message);
  }
}
