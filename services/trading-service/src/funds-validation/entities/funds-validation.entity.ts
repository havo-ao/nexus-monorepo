export class FundsValidation {
  constructor(
    public readonly approved: boolean,
    public readonly traderId: string,
    public readonly availableAmount: number,
    public readonly requiredAmount: number,
    public readonly reservedAmount: number,
    public readonly reason?: string,
  ) {}
}
