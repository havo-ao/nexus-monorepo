import { WatchlistItem } from '../entities/watchlist-item.entity';
import { InMemoryWatchlistsRepository } from './in-memory-watchlists.repository';

describe('InMemoryWatchlistsRepository', () => {
  let repository: InMemoryWatchlistsRepository;

  beforeEach(() => {
    repository = new InMemoryWatchlistsRepository();
  });

  it('adds and lists watchlist items by trader sorted by symbol', () => {
    repository.addItem(
      WatchlistItem.create({
        traderId: 'trader-123',
        symbol: 'MSFT',
        addedAt: new Date('2026-05-16T15:00:00.000Z'),
      }),
    );
    repository.addItem(
      WatchlistItem.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      }),
    );

    expect(
      repository
        .findByTraderId('trader-123')
        .map((item) => item.toSnapshot().symbol),
    ).toEqual(['AAPL', 'MSFT']);
  });

  it('does not duplicate trader-symbol pairs', () => {
    const item = WatchlistItem.create({
      traderId: 'trader-123',
      symbol: 'AAPL',
      addedAt: new Date('2026-05-16T14:00:00.000Z'),
    });

    repository.addItem(item);
    repository.addItem(item);

    expect(repository.findByTraderId('trader-123')).toHaveLength(1);
  });

  it('returns an empty list when the trader has no stored items', () => {
    expect(repository.findByTraderId(' trader-999 ')).toEqual([]);
  });

  it('removes items only from the requested trader watchlist', () => {
    repository.addItem(
      WatchlistItem.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      }),
    );
    repository.addItem(
      WatchlistItem.create({
        traderId: 'trader-456',
        symbol: 'AAPL',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      }),
    );

    repository.removeItem('trader-123', 'aapl');

    expect(repository.findByTraderId('trader-123')).toEqual([]);
    expect(repository.findByTraderId('trader-456')).toHaveLength(1);
  });
});
