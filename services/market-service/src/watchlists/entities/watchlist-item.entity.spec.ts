import { WatchlistItem } from './watchlist-item.entity';

describe('WatchlistItem', () => {
  it('normalizes symbol and preserves trader ownership', () => {
    const item = WatchlistItem.create({
      traderId: ' trader-123 ',
      symbol: ' aapl ',
      addedAt: new Date('2026-05-16T14:00:00.000Z'),
    });

    expect(item.toSnapshot()).toEqual({
      traderId: 'trader-123',
      symbol: 'AAPL',
      addedAt: new Date('2026-05-16T14:00:00.000Z'),
    });
  });

  it('rejects incomplete watchlist items', () => {
    expect(() =>
      WatchlistItem.create({
        traderId: '',
        symbol: 'AAPL',
        addedAt: new Date('2026-05-16T14:00:00.000Z'),
      }),
    ).toThrow(TypeError);
  });

  it('rejects invalid timestamps', () => {
    expect(() =>
      WatchlistItem.create({
        traderId: 'trader-123',
        symbol: 'AAPL',
        addedAt: new Date('invalid'),
      }),
    ).toThrow(TypeError);
  });
});
