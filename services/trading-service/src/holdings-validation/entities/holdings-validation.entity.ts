export class HoldingsValidation {
  constructor(
    public readonly approved: boolean,
    public readonly traderId: string,
    public readonly stockId: string,
    public readonly requestedQuantity: number,
    public readonly availableQuantity: number,
    public readonly symbol?: string,
    public readonly reason?: string,
  ) {}
}
