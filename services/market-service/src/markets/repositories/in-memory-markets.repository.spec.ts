import { InMemoryMarketsRepository } from './in-memory-markets.repository';

describe('InMemoryMarketsRepository', () => {
  it('returns the configured active markets', () => {
    const repository = new InMemoryMarketsRepository();

    const markets = repository.findAvailable();

    expect(markets.map((market) => market.toSnapshot().code)).toEqual([
      'NYSE',
      'NASDAQ',
      'LSE',
      'TSE',
      'ASX',
    ]);
    expect(markets.every((market) => market.isAvailable())).toBe(true);
  });
});
