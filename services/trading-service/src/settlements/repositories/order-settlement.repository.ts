import type { BrokerOrderStatusResponse } from '../../executions/clients/external-broker.client';
import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../orders/entities/trading-order.entity';
import type { TradingNotificationResult } from '../clients/trading-notification.client';
import type { OrderSettlement } from '../entities/order-settlement.entity';

export const ORDER_SETTLEMENT_REPOSITORY = Symbol(
  'ORDER_SETTLEMENT_REPOSITORY',
);

export type SettlementOrder = {
  id: string;
  orderReference: string;
  traderId: string;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  symbol: string;
  stockId?: string;
  quantity: number;
  estimatedUnitPrice: number;
  grossAmount: number;
  reservedAmount: number;
  currency: string;
};

export type SettlementBrokerExecution = {
  brokerName: string;
  externalOrderId: string;
  brokerStatus: string;
};

export type SettlementContext = {
  order: SettlementOrder;
  execution: SettlementBrokerExecution;
};

export type SettleBrokerStatusCommand = {
  context: SettlementContext;
  brokerStatus: BrokerOrderStatusResponse;
  nextStatus: OrderStatus;
  actorId: string;
  reason: string;
  commissionAmount: number;
  portfolioUpdated: boolean;
  fundsUpdated: boolean;
  notification: TradingNotificationResult;
};

export interface OrderSettlementRepository {
  findSettlementContext(
    orderReference: string,
  ): Promise<SettlementContext | null>;

  settleBrokerStatus(
    command: SettleBrokerStatusCommand,
  ): Promise<OrderSettlement>;
}
