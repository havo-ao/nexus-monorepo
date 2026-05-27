import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { roundMoney } from '../../common/money';
import type { CommissionDistribution } from '../entities/commission-distribution.entity';
import {
  COMMISSION_DISTRIBUTION_REPOSITORY,
  type CommissionDistributionRepository,
} from '../repositories/commission-distribution.repository';

const PLATFORM_SHARE_BPS = 7000;
const BROKER_SHARE_BPS = 3000;

export type DistributeCommissionInput = {
  traderId: string;
  brokerId: string;
  commissionAmount: number;
  currency?: string;
  orderReference?: string;
};

@Injectable()
export class CommissionDistributionService {
  constructor(
    @Inject(COMMISSION_DISTRIBUTION_REPOSITORY)
    private readonly distributionRepository: CommissionDistributionRepository,
  ) {}

  distribute(
    input: DistributeCommissionInput,
  ): Promise<CommissionDistribution> {
    this.assertValidInput(input);

    const commissionAmount = roundMoney(input.commissionAmount);
    const brokerAmount = roundMoney(
      (commissionAmount * BROKER_SHARE_BPS) / 10000,
    );
    const platformAmount = roundMoney(commissionAmount - brokerAmount);

    return this.distributionRepository.saveDistribution({
      traderId: input.traderId.trim(),
      brokerId: input.brokerId.trim(),
      commissionAmount,
      platformAmount,
      brokerAmount,
      platformShareBps: PLATFORM_SHARE_BPS,
      brokerShareBps: BROKER_SHARE_BPS,
      currency: input.currency?.trim().toUpperCase() || 'USD',
      distributedAt: new Date().toISOString(),
      orderReference: input.orderReference?.trim() || undefined,
    });
  }

  private assertValidInput(input: DistributeCommissionInput): void {
    if (!input.traderId || input.traderId.trim().length === 0) {
      throw new BadRequestException('traderId is required');
    }
    if (!input.brokerId || input.brokerId.trim().length === 0) {
      throw new BadRequestException('brokerId is required');
    }
    if (
      !Number.isFinite(input.commissionAmount) ||
      input.commissionAmount <= 0
    ) {
      throw new BadRequestException(
        'commissionAmount must be greater than zero',
      );
    }
  }
}
