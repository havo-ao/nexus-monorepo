import { Injectable } from '@nestjs/common';
import { Market } from '../entities/market.entity';
import type { MarketSnapshot } from '../entities/market.entity';
import type { MarketsRepository } from './markets.repository';

const ACTIVE_MARKET_ROWS: Array<
  readonly [
    code: string,
    name: string,
    country: string,
    currency: string,
    timezone: string,
    representativeSymbols: string[],
  ]
> = [
  [
    'NYSE',
    'New York Stock Exchange',
    'United States',
    'USD',
    'America/New_York',
    ['AAPL', 'JPM', 'KO'],
  ],
  [
    'NASDAQ',
    'NASDAQ Stock Market',
    'United States',
    'USD',
    'America/New_York',
    ['MSFT', 'GOOGL', 'TSLA'],
  ],
  [
    'LSE',
    'London Stock Exchange',
    'United Kingdom',
    'GBP',
    'Europe/London',
    ['HSBC', 'BP', 'VOD'],
  ],
  [
    'TSE',
    'Tokyo Stock Exchange',
    'Japan',
    'JPY',
    'Asia/Tokyo',
    ['7203.T', '6758.T', '9984.T'],
  ],
  [
    'ASX',
    'Australian Securities Exchange',
    'Australia',
    'AUD',
    'Australia/Sydney',
    ['BHP', 'CBA', 'WBC'],
  ],
];

function toActiveMarketSnapshot(
  row: (typeof ACTIVE_MARKET_ROWS)[number],
): MarketSnapshot {
  const [code, name, country, currency, timezone, representativeSymbols] = row;

  return {
    code,
    name,
    country,
    currency,
    timezone,
    status: 'ACTIVE',
    representativeSymbols,
  };
}

@Injectable()
export class InMemoryMarketsRepository implements MarketsRepository {
  private readonly markets = ACTIVE_MARKET_ROWS.map((row) =>
    Market.restore(toActiveMarketSnapshot(row)),
  );

  findAvailable(): Market[] {
    return this.markets.filter((market) => market.isAvailable());
  }
}
