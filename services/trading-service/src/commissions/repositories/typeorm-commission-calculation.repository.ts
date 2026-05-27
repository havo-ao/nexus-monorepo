import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommissionCalculation } from '../entities/commission-calculation.entity';
import { CommissionCalculationEvent } from '../entities/commission-calculation-event.entity';
import type {
  CommissionCalculationRepository,
  SaveCommissionCalculationCommand,
} from './commission-calculation.repository';

@Injectable()
export class TypeOrmCommissionCalculationRepository implements CommissionCalculationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveCalculation(
    command: SaveCommissionCalculationCommand,
  ): Promise<CommissionCalculation> {
    const repository = this.dataSource.getRepository(
      CommissionCalculationEvent,
    );
    const event = new CommissionCalculationEvent();
    event.traderId = command.traderId;
    event.orderReference = command.orderReference;
    event.side = command.side;
    event.orderType = command.orderType;
    event.grossAmount = command.grossAmount.toFixed(2);
    event.rateBps = command.rateBps;
    event.commissionAmount = command.commissionAmount.toFixed(2);
    event.netAmount = command.netAmount.toFixed(2);
    event.currency = command.currency;

    const savedEvent = await repository.save(event);

    return new CommissionCalculation(
      savedEvent.traderId,
      savedEvent.side,
      savedEvent.orderType,
      Number(savedEvent.grossAmount),
      savedEvent.rateBps,
      Number(savedEvent.commissionAmount),
      Number(savedEvent.netAmount),
      savedEvent.currency,
      savedEvent.createdAt.toISOString(),
      savedEvent.orderReference,
    );
  }
}
