import { Injectable } from '@nestjs/common';
import { evaluateMarketSession } from '../services/market-session-clock';
import type {
  MarketSchedule,
  MarketStatusRepository,
  MarketValidationResult,
} from './market-status.repository';

@Injectable()
export class InMemoryMarketStatusRepository implements MarketStatusRepository {
  private readonly schedulesByExchange = new Map<string, MarketSchedule>([
    [
      '1',
      {
        exchangeId: '1',
        timezone: 'America/New_York',
        openTime: '09:30:00',
        closeTime: '16:00:00',
      },
    ],
  ]);

  readonly validationEvents: MarketValidationResult[] = [];

  validateMarketStatus(
    exchangeId: string,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult> {
    const result = evaluateMarketSession(
      this.schedulesByExchange.get(exchangeId) ?? null,
      exchangeId,
      evaluatedAt,
    );
    this.validationEvents.push(result);
    return Promise.resolve(result);
  }
}
