export const TRADER_FUNDS_REPOSITORY = Symbol('TRADER_FUNDS_REPOSITORY');

export interface FundsReservationResult {
  approved: boolean;
  traderId: string;
  availableAmount: number;
  requiredAmount: number;
  reservedAmount: number;
  reason?: string;
}

export interface TraderFundsRepository {
  reserveBuyFunds(
    traderId: string,
    requiredAmount: number,
  ): Promise<FundsReservationResult>;
}
