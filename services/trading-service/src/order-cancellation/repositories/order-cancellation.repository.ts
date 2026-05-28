import type { OrderCancellation } from '../entities/order-cancellation.entity';

export const ORDER_CANCELLATION_REPOSITORY = Symbol(
  'ORDER_CANCELLATION_REPOSITORY',
);

export type CancelOrderCommand = {
  orderReference: string;
  actorId: string;
  reason: string;
};

export type CancelOrderResult = {
  cancelled: boolean;
  cancellation?: OrderCancellation;
  reason?: string;
};

export interface OrderCancellationRepository {
  cancelOrder(command: CancelOrderCommand): Promise<CancelOrderResult>;
}
