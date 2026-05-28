import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../orders/entities/trading-order.entity';

export const PENDING_ORDER_REPOSITORY = Symbol('PENDING_ORDER_REPOSITORY');

export type ProcessableOrder = {
  id: string;
  orderReference: string;
  traderId: string;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  symbol: string;
  exchangeId: string;
  quantity: number;
  estimatedUnitPrice: number;
  grossAmount: number;
  currency: string;
  limitPrice?: number;
};

export type PendingOrderEvaluationCommand = {
  order: ProcessableOrder;
  matched: boolean;
  action: string;
  reason: string;
  evaluatedAt: Date;
  marketStatus?: string;
  marketPrice?: number;
  triggerPrice?: number;
  nextStatus?: OrderStatus;
};

export type MarkReadyForExecutionCommand = PendingOrderEvaluationCommand & {
  matched: true;
  nextStatus: 'PENDING_EXECUTION';
};

export interface PendingOrderRepository {
  findProcessableOrders(limit: number): Promise<ProcessableOrder[]>;
  recordEvaluation(command: PendingOrderEvaluationCommand): Promise<void>;
  markReadyForExecution(
    command: MarkReadyForExecutionCommand,
  ): Promise<ProcessableOrder>;
}
