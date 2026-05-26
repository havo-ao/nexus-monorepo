import type { OrderSide, OrderStatus, OrderType } from './trading-order.entity';

export class TradingOrder {
  constructor(
    readonly id: string,
    readonly orderReference: string,
    readonly traderId: string,
    readonly side: OrderSide,
    readonly orderType: OrderType,
    readonly status: OrderStatus,
    readonly symbol: string,
    readonly exchangeId: string,
    readonly quantity: number,
    readonly estimatedUnitPrice: number,
    readonly grossAmount: number,
    readonly reservedAmount: number,
    readonly currency: string,
    readonly createdAt: string,
    readonly limitPrice?: number,
    readonly rejectionReason?: string,
  ) {}
}
