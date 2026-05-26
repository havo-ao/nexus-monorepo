export type MarketStatus = 'OPEN' | 'CLOSED' | 'RESTRICTED';

export class MarketValidation {
  constructor(
    readonly canOperate: boolean,
    readonly exchangeId: string,
    readonly marketStatus: MarketStatus,
    readonly evaluatedAt: string,
    readonly timezone?: string,
    readonly openTime?: string,
    readonly closeTime?: string,
    readonly reason?: string,
  ) {}
}
