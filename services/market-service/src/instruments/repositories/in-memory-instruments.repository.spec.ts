import { InMemoryInstrumentsRepository } from './in-memory-instruments.repository';
import { Instrument } from '../entities/instrument.entity';

describe('InMemoryInstrumentsRepository', () => {
  it('returns configured active instruments sorted by symbol', () => {
    const repository = new InMemoryInstrumentsRepository();

    const instruments = repository.findAvailable();

    expect(
      instruments.map((instrument) => instrument.toSnapshot().symbol),
    ).toEqual(['AAPL', 'HSBC', 'JPM', 'KO', 'MSFT', 'TSLA']);
    expect(instruments.every((instrument) => instrument.isAvailable())).toBe(
      true,
    );
  });

  it('finds an instrument by normalized symbol', () => {
    const repository = new InMemoryInstrumentsRepository();

    expect(repository.findBySymbol(' aapl ')?.toSnapshot()).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
      }),
    );
  });

  it('returns null when instrument symbol is not configured', () => {
    const repository = new InMemoryInstrumentsRepository();

    expect(repository.findBySymbol('ZZZZ')).toBeNull();
  });

  it('upserts synchronized instruments into the local catalog', () => {
    const repository = new InMemoryInstrumentsRepository();

    repository.saveInstruments([
      Instrument.restore({
        symbol: ' nvda ',
        name: 'NVIDIA Corporation',
        marketCode: 'nasdaq',
        currency: 'usd',
        sector: 'Unclassified',
        status: 'ACTIVE',
      }),
    ]);

    expect(repository.findBySymbol('NVDA')?.toSnapshot()).toEqual({
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Unclassified',
      status: 'ACTIVE',
    });
  });

  it('updates metadata for an existing local instrument', () => {
    const repository = new InMemoryInstrumentsRepository();
    const metadataUpdatedAt = new Date('2026-05-20T18:00:00.000Z');

    repository.updateInstrumentMetadata(' aapl ', {
      sector: 'Technology',
      industry: 'Consumer Electronics',
      country: 'USA',
      description: 'Apple overview',
      metadataProvider: 'alpha-vantage-overview-compatible',
      metadataUpdatedAt,
    });

    expect(repository.findBySymbol('AAPL')?.toSnapshot()).toEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        country: 'USA',
        description: 'Apple overview',
        metadataProvider: 'alpha-vantage-overview-compatible',
        metadataUpdatedAt,
      }),
    );
  });

  it('ignores metadata updates for unknown instruments', () => {
    const repository = new InMemoryInstrumentsRepository();

    repository.updateInstrumentMetadata('ZZZZ', {
      sector: 'Technology',
    });

    expect(repository.findBySymbol('ZZZZ')).toBeNull();
  });
});
