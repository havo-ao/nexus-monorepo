import { Test, TestingModule } from '@nestjs/testing';
import { MYSQL_POOL } from '../../../database/database.module';
import { Instrument } from '../entities/instrument.entity';
import { MysqlInstrumentsRepository } from './mysql-instruments.repository';

describe('MysqlInstrumentsRepository', () => {
  const pool = {
    query: jest.fn(),
  };

  let repository: MysqlInstrumentsRepository;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MysqlInstrumentsRepository,
        {
          provide: MYSQL_POOL,
          useValue: pool,
        },
      ],
    }).compile();

    repository = module.get<MysqlInstrumentsRepository>(
      MysqlInstrumentsRepository,
    );
  });

  it('restores active instruments from stored metadata', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          market_code: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        },
      ],
    ]);

    const instruments = await repository.findAvailable();

    expect(instruments.map((instrument) => instrument.toSnapshot())).toEqual([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      },
    ]);
  });

  it('upserts synchronized instruments', async () => {
    const instrument = Instrument.restore({
      symbol: 'nvda',
      name: 'NVIDIA Corporation',
      marketCode: 'nasdaq',
      currency: 'usd',
      sector: 'Unclassified',
      status: 'ACTIVE',
    });

    await repository.saveInstruments([instrument]);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ON DUPLICATE KEY UPDATE'),
      [
        'NVDA',
        'NVIDIA Corporation',
        'NASDAQ',
        'USD',
        'Unclassified',
        'ACTIVE',
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'INACTIVE'"),
      ['NVDA'],
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE instruments'),
      ['NVDA'],
    );
  });

  it('persists synchronized instruments in batches', async () => {
    const instruments = [
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
      Instrument.restore({
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    ];

    await repository.saveInstruments(instruments);

    expect(pool.query.mock.calls[0]).toEqual([
      expect.stringContaining(
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ),
      [
        'AAPL',
        'Apple Inc.',
        'NASDAQ',
        'USD',
        'Technology',
        'ACTIVE',
        null,
        null,
        null,
        null,
        null,
        null,
        'MSFT',
        'Microsoft Corporation',
        'NASDAQ',
        'USD',
        'Technology',
        'ACTIVE',
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    ]);
  });

  it('updates external metadata for an instrument', async () => {
    const metadataUpdatedAt = new Date('2026-05-20T18:00:00.000Z');

    await repository.updateInstrumentMetadata(' aapl ', {
      name: 'Apple Inc.',
      sector: 'Technology',
      assetType: 'Common Stock',
      industry: 'Consumer Electronics',
      country: 'USA',
      description: 'Apple overview',
      metadataProvider: 'alpha-vantage-overview',
      metadataUpdatedAt,
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('metadata_updated_at = ?'),
      [
        'Apple Inc.',
        'Technology',
        'Common Stock',
        'Consumer Electronics',
        'USA',
        'Apple overview',
        'alpha-vantage-overview',
        metadataUpdatedAt,
        'AAPL',
      ],
    );
  });

  it('stores null values when optional metadata is absent', async () => {
    await repository.updateInstrumentMetadata('AAPL', {
      name: 'Apple Inc.',
      sector: 'Technology',
    });

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'Apple Inc.',
      'Technology',
      null,
      null,
      null,
      null,
      null,
      null,
      'AAPL',
    ]);
  });

  it('does not persist when synchronized catalog is empty', async () => {
    await repository.saveInstruments([]);

    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects invalid stored metadata through the domain entity', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: '',
          name: 'Apple Inc.',
          market_code: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        },
      ],
    ]);

    await expect(repository.findAvailable()).rejects.toThrow(TypeError);
  });

  it('finds an active instrument by symbol', async () => {
    pool.query.mockResolvedValueOnce([
      [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          market_code: 'NASDAQ',
          currency: 'USD',
          sector: 'Technology',
          status: 'ACTIVE',
        },
      ],
    ]);

    const instrument = await repository.findBySymbol(' aapl ');

    expect(instrument?.toSnapshot()).toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
    });
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['AAPL']);
  });

  it('returns null when an instrument is not stored', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await expect(repository.findBySymbol('ZZZZ')).resolves.toBeNull();
  });
});
