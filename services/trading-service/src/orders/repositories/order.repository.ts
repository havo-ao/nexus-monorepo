import type { TradingOrder } from '../entities/trading-order';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export type CreateMarketBuyOrderCommand = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  grossAmount: number;
  currency: string;
  initialStatus?: 'PENDING_EXECUTION' | 'PENDING_MARKET_OPEN';
  statusReason?: string;
};

export type CreateLimitBuyOrderCommand = {
  traderId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  grossAmount: number;
  currency: string;
};

export type CreateMarketSellOrderCommand = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  grossAmount: number;
  currency: string;
  initialStatus?: 'PENDING_EXECUTION' | 'PENDING_MARKET_OPEN';
  statusReason?: string;
};

export type CreateLimitSellOrderCommand = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  limitPrice: number;
  grossAmount: number;
  currency: string;
};

export type CreateStopLossOrderCommand = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  stopPrice: number;
  grossAmount: number;
  currency: string;
};

export type CreateTakeProfitOrderCommand = {
  traderId: string;
  stockId: string;
  symbol: string;
  exchangeId: string;
  quantity: number;
  targetPrice: number;
  grossAmount: number;
  currency: string;
};

export type OrderCreationResult = {
  approved: boolean;
  order?: TradingOrder;
  reason?: string;
  availableAmount?: number;
  requiredAmount?: number;
  availableQuantity?: number;
  requiredQuantity?: number;
};

export interface OrderRepository {
  createMarketBuyOrder(
    command: CreateMarketBuyOrderCommand,
  ): Promise<OrderCreationResult>;

  createLimitBuyOrder(
    command: CreateLimitBuyOrderCommand,
  ): Promise<OrderCreationResult>;

  createMarketSellOrder(
    command: CreateMarketSellOrderCommand,
  ): Promise<OrderCreationResult>;

  createLimitSellOrder(
    command: CreateLimitSellOrderCommand,
  ): Promise<OrderCreationResult>;

  createStopLossOrder(
    command: CreateStopLossOrderCommand,
  ): Promise<OrderCreationResult>;

  createTakeProfitOrder(
    command: CreateTakeProfitOrderCommand,
  ): Promise<OrderCreationResult>;
}
