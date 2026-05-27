import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../orders/entities/trading-order.entity';

export class BrokerOrderExecution {
  constructor(
    readonly orderId: string,
    readonly orderReference: string,
    readonly traderId: string,
    readonly side: OrderSide,
    readonly orderType: OrderType,
    readonly status: OrderStatus,
    readonly symbol: string,
    readonly quantity: number,
    readonly externalOrderId: string,
    readonly brokerStatus: string,
    readonly brokerName: string,
    readonly sentAt: string,
  ) {}
}
