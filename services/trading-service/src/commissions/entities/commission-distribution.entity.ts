export class CommissionDistribution {
  constructor(
    readonly traderId: string,
    readonly brokerId: string,
    readonly commissionAmount: number,
    readonly platformAmount: number,
    readonly brokerAmount: number,
    readonly platformShareBps: number,
    readonly brokerShareBps: number,
    readonly currency: string,
    readonly distributedAt: string,
    readonly orderReference?: string,
  ) {}
}
