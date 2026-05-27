import type {
  OrderSide,
  OrderType,
} from '../../orders/entities/trading-order.entity';

export class CommissionCalculation {
  constructor(
    readonly traderId: string,
    readonly side: OrderSide,
    readonly orderType: OrderType,
    readonly grossAmount: number,
    readonly rateBps: number,
    readonly commissionAmount: number,
    readonly netAmount: number,
    readonly currency: string,
    readonly calculatedAt: string,
    readonly orderReference?: string,
  ) {}
}
