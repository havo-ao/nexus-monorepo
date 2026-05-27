import { Injectable } from '@nestjs/common';
import { CommissionDistribution } from '../entities/commission-distribution.entity';
import type {
  CommissionDistributionRepository,
  SaveCommissionDistributionCommand,
} from './commission-distribution.repository';

@Injectable()
export class InMemoryCommissionDistributionRepository implements CommissionDistributionRepository {
  readonly distributions: CommissionDistribution[] = [];

  saveDistribution(
    command: SaveCommissionDistributionCommand,
  ): Promise<CommissionDistribution> {
    const distribution = new CommissionDistribution(
      command.traderId,
      command.brokerId,
      command.commissionAmount,
      command.platformAmount,
      command.brokerAmount,
      command.platformShareBps,
      command.brokerShareBps,
      command.currency,
      command.distributedAt,
      command.orderReference,
    );
    this.distributions.push(distribution);

    return Promise.resolve(distribution);
  }
}
