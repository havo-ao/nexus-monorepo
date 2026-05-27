import type { OrderSide } from '../../orders/entities/trading-order.entity';

export const PORTFOLIO_SETTLEMENT_CLIENT = Symbol(
  'PORTFOLIO_SETTLEMENT_CLIENT',
);

export type ApplyPortfolioSettlementCommand = {
  authorizationHeader?: string;
  traderId: string;
  stockId?: string;
  side: OrderSide;
  quantity: number;
  executionPrice: number;
  grossAmount: number;
  netAmount: number;
  reservedAmount: number;
  currency: string;
  orderReference: string;
  externalOrderId: string;
  executedAt: string;
};

export type PortfolioSettlementResult = {
  portfolioUpdated: boolean;
  fundsUpdated: boolean;
  reason?: string;
};

export interface PortfolioSettlementClient {
  applyExecutedOrder(
    command: ApplyPortfolioSettlementCommand,
  ): Promise<PortfolioSettlementResult>;
}

export class PortfolioSettlementError extends Error {
  constructor(message: string) {
    super(message);
  }
}
