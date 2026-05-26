import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PortfolioPosition } from '../../../portfolio/domain/entities/portfolio-position.entity';
import { HoldingsValidationEvent } from '../../domain/entities/holdings-validation-event.entity';
import type {
  HoldingsValidationResult,
  TraderHoldingsRepository,
} from '../../domain/repositories/trader-holdings.repository';

@Injectable()
export class TypeOrmTraderHoldingsRepository implements TraderHoldingsRepository {
  constructor(private readonly dataSource: DataSource) {}

  validateSellHoldings(input: {
    traderId: string;
    stockId: string;
    symbol?: string;
    quantity: number;
  }): Promise<HoldingsValidationResult> {
    return this.dataSource.transaction((manager) =>
      this.validateSellHoldingsInTransaction(manager, input),
    );
  }

  private async validateSellHoldingsInTransaction(
    manager: EntityManager,
    input: {
      traderId: string;
      stockId: string;
      symbol?: string;
      quantity: number;
    },
  ): Promise<HoldingsValidationResult> {
    const positionRepository = manager.getRepository(PortfolioPosition);
    const eventRepository = manager.getRepository(HoldingsValidationEvent);

    const position = await positionRepository.findOne({
      where: { traderId: input.traderId, stockId: input.stockId },
      lock: { mode: 'pessimistic_read' },
    });
    const availableQuantity = position?.quantity ?? 0;

    const result: HoldingsValidationResult =
      availableQuantity >= input.quantity
        ? {
            approved: true,
            traderId: input.traderId,
            stockId: input.stockId,
            symbol: input.symbol,
            requestedQuantity: input.quantity,
            availableQuantity,
          }
        : {
            approved: false,
            traderId: input.traderId,
            stockId: input.stockId,
            symbol: input.symbol,
            requestedQuantity: input.quantity,
            availableQuantity,
            reason: 'Insufficient available holdings',
          };

    await eventRepository.save(this.toEvent(result));

    return result;
  }

  private toEvent(result: HoldingsValidationResult): HoldingsValidationEvent {
    const event = new HoldingsValidationEvent();
    event.traderId = result.traderId;
    event.stockId = result.stockId;
    event.symbol = result.symbol;
    event.requestedQuantity = result.requestedQuantity.toFixed(6);
    event.availableQuantity = result.availableQuantity.toFixed(6);
    event.approved = result.approved;
    event.reason = result.reason;
    return event;
  }
}
