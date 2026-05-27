import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommissionDistributionEvent } from '../entities/commission-distribution-event.entity';
import { CommissionDistribution } from '../entities/commission-distribution.entity';
import type {
  CommissionDistributionRepository,
  SaveCommissionDistributionCommand,
} from './commission-distribution.repository';

@Injectable()
export class TypeOrmCommissionDistributionRepository implements CommissionDistributionRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveDistribution(
    command: SaveCommissionDistributionCommand,
  ): Promise<CommissionDistribution> {
    const repository = this.dataSource.getRepository(
      CommissionDistributionEvent,
    );
    const event = new CommissionDistributionEvent();
    event.traderId = command.traderId;
    event.brokerId = command.brokerId;
    event.orderReference = command.orderReference;
    event.commissionAmount = command.commissionAmount.toFixed(2);
    event.platformAmount = command.platformAmount.toFixed(2);
    event.brokerAmount = command.brokerAmount.toFixed(2);
    event.platformShareBps = command.platformShareBps;
    event.brokerShareBps = command.brokerShareBps;
    event.currency = command.currency;

    const savedEvent = await repository.save(event);

    return new CommissionDistribution(
      savedEvent.traderId,
      savedEvent.brokerId,
      Number(savedEvent.commissionAmount),
      Number(savedEvent.platformAmount),
      Number(savedEvent.brokerAmount),
      savedEvent.platformShareBps,
      savedEvent.brokerShareBps,
      savedEvent.currency,
      savedEvent.createdAt.toISOString(),
      savedEvent.orderReference,
    );
  }
}
