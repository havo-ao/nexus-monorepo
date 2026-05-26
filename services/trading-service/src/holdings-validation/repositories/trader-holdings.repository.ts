export const TRADER_HOLDINGS_REPOSITORY = Symbol('TRADER_HOLDINGS_REPOSITORY');

export interface HoldingsValidationResult {
  approved: boolean;
  traderId: string;
  stockId: string;
  requestedQuantity: number;
  availableQuantity: number;
  symbol?: string;
  reason?: string;
}

export interface TraderHoldingsRepository {
  validateSellHoldings(input: {
    traderId: string;
    stockId: string;
    symbol?: string;
    quantity: number;
  }): Promise<HoldingsValidationResult>;
}
