import type {
  OrderSide,
  OrderType,
} from '../../orders/entities/trading-order.entity';
import type { CommissionCalculation } from '../entities/commission-calculation.entity';

export const COMMISSION_CALCULATION_REPOSITORY = Symbol(
  'COMMISSION_CALCULATION_REPOSITORY',
);

export type SaveCommissionCalculationCommand = {
  traderId: string;
  side: OrderSide;
  orderType: OrderType;
  grossAmount: number;
  rateBps: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  calculatedAt: string;
  orderReference?: string;
};

export interface CommissionCalculationRepository {
  saveCalculation(
    command: SaveCommissionCalculationCommand,
  ): Promise<CommissionCalculation>;
}
