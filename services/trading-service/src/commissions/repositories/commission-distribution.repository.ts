import type { CommissionDistribution } from '../entities/commission-distribution.entity';

export const COMMISSION_DISTRIBUTION_REPOSITORY = Symbol(
  'COMMISSION_DISTRIBUTION_REPOSITORY',
);

export type SaveCommissionDistributionCommand = {
  traderId: string;
  brokerId: string;
  commissionAmount: number;
  platformAmount: number;
  brokerAmount: number;
  platformShareBps: number;
  brokerShareBps: number;
  currency: string;
  distributedAt: string;
  orderReference?: string;
};

export interface CommissionDistributionRepository {
  saveDistribution(
    command: SaveCommissionDistributionCommand,
  ): Promise<CommissionDistribution>;
}
