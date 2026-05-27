import type {
  OrderSide,
  OrderStatus,
} from '../../orders/entities/trading-order.entity';

export class OrderSettlement {
  constructor(
    readonly orderId: string,
    readonly orderReference: string,
    readonly traderId: string,
    readonly side: OrderSide,
    readonly status: OrderStatus,
    readonly symbol: string,
    readonly quantity: number,
    readonly filledQuantity: number,
    readonly averageFilledPrice: number | undefined,
    readonly settledAmount: number,
    readonly commissionAmount: number,
    readonly netAmount: number,
    readonly currency: string,
    readonly brokerName: string,
    readonly externalOrderId: string,
    readonly brokerStatus: string,
    readonly portfolioUpdated: boolean,
    readonly fundsUpdated: boolean,
    readonly notificationDelivered: boolean,
    readonly settledAt: string,
  ) {}
}
