import type { OrderStatus } from '../../orders/entities/trading-order.entity';

export type BrokerValidationDecision = 'APPROVE' | 'REJECT';

export class BrokerOrderValidation {
  constructor(
    readonly orderId: string,
    readonly orderReference: string,
    readonly brokerId: string,
    readonly decision: BrokerValidationDecision,
    readonly status: OrderStatus,
    readonly reason: string,
    readonly validatedAt: string,
  ) {}
}
