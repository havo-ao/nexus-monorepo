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

export type MarketBuyOrderCreationResult = {
  approved: boolean;
  order?: TradingOrder;
  reason?: string;
  availableAmount: number;
  requiredAmount: number;
};

export interface OrderRepository {
  createMarketBuyOrder(
    command: CreateMarketBuyOrderCommand,
  ): Promise<MarketBuyOrderCreationResult>;

  createLimitBuyOrder(
    command: CreateLimitBuyOrderCommand,
  ): Promise<MarketBuyOrderCreationResult>;
}
