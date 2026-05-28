import { Injectable } from '@nestjs/common';
import { CommissionCalculation } from '../entities/commission-calculation.entity';
import type {
  CommissionCalculationRepository,
  SaveCommissionCalculationCommand,
} from './commission-calculation.repository';

@Injectable()
export class InMemoryCommissionCalculationRepository implements CommissionCalculationRepository {
  readonly calculations: CommissionCalculation[] = [];

  saveCalculation(
    command: SaveCommissionCalculationCommand,
  ): Promise<CommissionCalculation> {
    const calculation = new CommissionCalculation(
      command.traderId,
      command.side,
      command.orderType,
      command.grossAmount,
      command.rateBps,
      command.commissionAmount,
      command.netAmount,
      command.currency,
      command.calculatedAt,
      command.orderReference,
    );
    this.calculations.push(calculation);

    return Promise.resolve(calculation);
  }
}
