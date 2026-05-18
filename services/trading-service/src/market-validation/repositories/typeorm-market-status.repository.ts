import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { MarketExchange } from '../../market/entities/market-exchange.entity';
import { MarketValidationEvent } from '../entities/market-validation-event.entity';
import { evaluateMarketSession } from '../services/market-session-clock';
import type {
  MarketSchedule,
  MarketStatusRepository,
  MarketValidationResult,
} from './market-status.repository';

@Injectable()
export class TypeOrmMarketStatusRepository implements MarketStatusRepository {
  constructor(private readonly dataSource: DataSource) {}

  validateMarketStatus(
    exchangeId: string,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult> {
    return this.dataSource.transaction((manager) =>
      this.validateMarketStatusInTransaction(manager, exchangeId, evaluatedAt),
    );
  }

  private async validateMarketStatusInTransaction(
    manager: EntityManager,
    exchangeId: string,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult> {
    const exchangeRepository = manager.getRepository(MarketExchange);
    const eventRepository = manager.getRepository(MarketValidationEvent);
    const exchange = await exchangeRepository.findOne({
      where: { id: exchangeId },
    });
    const schedule = exchange ? this.toSchedule(exchange) : null;
    const result = evaluateMarketSession(schedule, exchangeId, evaluatedAt);

    await eventRepository.save(this.toEvent(result));

    return result;
  }

  private toSchedule(exchange: MarketExchange): MarketSchedule {
    return {
      exchangeId: exchange.id,
      timezone: exchange.timezone,
      openTime: exchange.openTime,
      closeTime: exchange.closeTime,
    };
  }

  private toEvent(result: MarketValidationResult): MarketValidationEvent {
    const event = new MarketValidationEvent();
    event.exchangeId = result.exchangeId;
    event.marketStatus = result.marketStatus;
    event.canOperate = result.canOperate;
    event.evaluatedAt = result.evaluatedAt;
    event.timezone = result.timezone;
    event.openTime = result.openTime;
    event.closeTime = result.closeTime;
    event.reason = result.reason;
    return event;
  }
}
