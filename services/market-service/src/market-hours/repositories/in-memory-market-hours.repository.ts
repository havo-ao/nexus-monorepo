import { Injectable } from '@nestjs/common';
import { MarketHours } from '../entities/market-hours.entity';
import type {
  MarketConfigurationChange,
  MarketHoursRepository,
} from './market-hours.repository';

@Injectable()
export class InMemoryMarketHoursRepository implements MarketHoursRepository {
  private readonly markets = [
    MarketHours.restore({
      marketCode: 'NYSE',
      timezone: 'America/New_York',
      openTime: { hour: 9, minute: 30 },
      closeTime: { hour: 16, minute: 0 },
      operatingDays: [1, 2, 3, 4, 5],
      restrictions: [
        {
          date: '2026-05-25',
          status: 'CLOSED',
          reason: 'Memorial Day market holiday',
        },
      ],
    }),
    MarketHours.restore({
      marketCode: 'NASDAQ',
      timezone: 'America/New_York',
      openTime: { hour: 9, minute: 30 },
      closeTime: { hour: 16, minute: 0 },
      operatingDays: [1, 2, 3, 4, 5],
      restrictions: [
        {
          date: '2026-05-25',
          status: 'CLOSED',
          reason: 'Memorial Day market holiday',
        },
      ],
    }),
  ];

  findByMarketCode(marketCode: string): Promise<MarketHours | null> {
    const normalizedMarketCode = marketCode.toUpperCase();

    return Promise.resolve(
      this.markets.find(
        (market) => market.toSnapshot().marketCode === normalizedMarketCode,
      ) ?? null,
    );
  }

  save(
    marketHours: MarketHours,
    change: MarketConfigurationChange,
  ): Promise<MarketHours> {
    void change;

    const snapshot = marketHours.toSnapshot();
    const existingIndex = this.markets.findIndex(
      (market) => market.toSnapshot().marketCode === snapshot.marketCode,
    );

    if (existingIndex >= 0) {
      this.markets[existingIndex] = marketHours;
    } else {
      this.markets.push(marketHours);
    }

    return Promise.resolve(marketHours);
  }
}
