import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../orders/entities/trading-order.entity';
import type {
  BrokerOrderValidation,
  BrokerValidationDecision,
} from '../entities/broker-order-validation.entity';

export const BROKER_ORDER_VALIDATION_REPOSITORY = Symbol(
  'BROKER_ORDER_VALIDATION_REPOSITORY',
);

export type BrokerValidatableOrder = {
  id: string;
  orderReference: string;
  traderId: string;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
};

export type SaveBrokerOrderValidationCommand = {
  order: BrokerValidatableOrder;
  brokerId: string;
  decision: BrokerValidationDecision;
  nextStatus: OrderStatus;
  reason: string;
};

export interface BrokerOrderValidationRepository {
  findOrderByReference(
    orderReference: string,
  ): Promise<BrokerValidatableOrder | null>;

  saveValidation(
    command: SaveBrokerOrderValidationCommand,
  ): Promise<BrokerOrderValidation>;
}
