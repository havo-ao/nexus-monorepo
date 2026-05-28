export type ComplianceValidationOperation =
  | 'CREATE_MARKET_BUY_ORDER'
  | 'CREATE_LIMIT_BUY_ORDER'
  | 'CREATE_MARKET_SELL_ORDER'
  | 'CREATE_LIMIT_SELL_ORDER'
  | 'CREATE_STOP_LOSS_ORDER'
  | 'CREATE_TAKE_PROFIT_ORDER';

export class ComplianceValidation {
  constructor(
    readonly traderId: string,
    readonly operation: ComplianceValidationOperation,
    readonly allowed: boolean,
    readonly status: string,
    readonly reason?: string,
  ) {}
}
