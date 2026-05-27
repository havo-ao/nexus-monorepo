import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { roundMoney } from '../../common/money';
import type {
  OrderSide,
  OrderType,
} from '../../orders/entities/trading-order.entity';
import type { CommissionCalculation } from '../entities/commission-calculation.entity';
import {
  COMMISSION_CALCULATION_REPOSITORY,
  type CommissionCalculationRepository,
} from '../repositories/commission-calculation.repository';

const PLATFORM_COMMISSION_RATE_BPS = 35;
const MINIMUM_COMMISSION_AMOUNT = 1;
const ORDER_TYPES: readonly OrderType[] = [
  'MARKET',
  'LIMIT',
  'STOP_LOSS',
  'TAKE_PROFIT',
];

export type CalculateCommissionInput = {
  traderId: string;
  side: OrderSide;
  orderType: OrderType;
  grossAmount: number;
  currency?: string;
  orderReference?: string;
};

@Injectable()
export class CommissionCalculationService {
  constructor(
    @Inject(COMMISSION_CALCULATION_REPOSITORY)
    private readonly commissionRepository: CommissionCalculationRepository,
  ) {}

  calculate(input: CalculateCommissionInput): Promise<CommissionCalculation> {
    this.assertValidInput(input);

    const grossAmount = roundMoney(input.grossAmount);
    const rawCommission = roundMoney(
      (grossAmount * PLATFORM_COMMISSION_RATE_BPS) / 10000,
    );
    const commissionAmount = roundMoney(
      Math.max(rawCommission, MINIMUM_COMMISSION_AMOUNT),
    );
    const netAmount =
      input.side === 'BUY'
        ? roundMoney(grossAmount + commissionAmount)
        : roundMoney(grossAmount - commissionAmount);

    return this.commissionRepository.saveCalculation({
      traderId: input.traderId.trim(),
      side: input.side,
      orderType: input.orderType,
      grossAmount,
      rateBps: PLATFORM_COMMISSION_RATE_BPS,
      commissionAmount,
      netAmount,
      currency: input.currency?.trim().toUpperCase() || 'USD',
      calculatedAt: new Date().toISOString(),
      orderReference: input.orderReference?.trim() || undefined,
    });
  }

  private assertValidInput(input: CalculateCommissionInput): void {
    if (!input.traderId || input.traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }
    if (input.side !== 'BUY' && input.side !== 'SELL') {
      throw new BadRequestException('side must be BUY or SELL');
    }
    if (!ORDER_TYPES.includes(input.orderType)) {
      throw new BadRequestException('orderType is not supported');
    }
    if (!Number.isFinite(input.grossAmount) || input.grossAmount <= 0) {
      throw new BadRequestException('grossAmount must be greater than zero');
    }
  }
}
