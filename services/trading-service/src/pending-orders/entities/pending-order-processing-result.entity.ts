export type PendingOrderEvaluationStatus =
  | 'READY_FOR_EXECUTION'
  | 'WAITING_MARKET_OPEN'
  | 'WAITING_CONDITION'
  | 'SKIPPED'
  | 'FAILED';

export class PendingOrderEvaluation {
  constructor(
    readonly orderReference: string,
    readonly status: PendingOrderEvaluationStatus,
    readonly reason: string,
    readonly marketStatus?: string,
    readonly marketPrice?: number,
    readonly triggerPrice?: number,
  ) {}
}

export class PendingOrderProcessingResult {
  constructor(
    readonly evaluatedAt: string,
    readonly scanned: number,
    readonly readyForExecution: number,
    readonly waiting: number,
    readonly failed: number,
    readonly evaluations: PendingOrderEvaluation[],
  ) {}
}
