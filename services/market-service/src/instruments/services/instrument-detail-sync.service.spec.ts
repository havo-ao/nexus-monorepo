import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataSyncService } from '../../quotes/services/market-data-sync.service';
import { QuoteHistoryService } from '../../quotes/services/quote-history.service';
import { QuoteHistorySyncService } from '../../quotes/services/quote-history-sync.service';
import { InstrumentDetailService } from './instrument-detail.service';
import { InstrumentDetailSyncService } from './instrument-detail-sync.service';
import { InstrumentMetadataSyncService } from './instrument-metadata-sync.service';

describe('InstrumentDetailSyncService', () => {
  const detailService = {
    getInstrumentDetail: jest.fn(),
  };
  const metadataSyncService = {
    synchronizeMetadata: jest.fn(),
  };
  const marketDataSyncService = {
    synchronizeMarketData: jest.fn(),
  };
  const quoteHistoryService = {
    getPriceHistory: jest.fn(),
  };
  const quoteHistorySyncService = {
    synchronizePriceHistory: jest.fn(),
  };

  const detail = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    marketCode: 'NASDAQ',
    currency: 'USD',
    sector: 'Technology',
    status: 'ACTIVE',
    assetType: 'Common Stock',
    industry: 'Consumer Electronics',
    country: 'USA',
    description: 'Apple overview',
    metadataProvider: 'alpha-vantage-overview-compatible',
    metadataUpdatedAt: '2026-05-20T18:00:00.000Z',
    quote: {
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      spread: 0.1,
      currency: 'USD',
      provider: 'alpha-vantage-compatible',
      asOf: '2026-05-20T18:00:00.000Z',
    },
  };

  let service: InstrumentDetailSyncService;
  const originalDetailSyncDelay =
    process.env.ALPHA_VANTAGE_DETAIL_SYNC_DELAY_MS;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.ALPHA_VANTAGE_DETAIL_SYNC_DELAY_MS = '0';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentDetailSyncService,
        {
          provide: InstrumentDetailService,
          useValue: detailService,
        },
        {
          provide: InstrumentMetadataSyncService,
          useValue: metadataSyncService,
        },
        {
          provide: MarketDataSyncService,
          useValue: marketDataSyncService,
        },
        {
          provide: QuoteHistoryService,
          useValue: quoteHistoryService,
        },
        {
          provide: QuoteHistorySyncService,
          useValue: quoteHistorySyncService,
        },
      ],
    }).compile();

    service = module.get<InstrumentDetailSyncService>(
      InstrumentDetailSyncService,
    );
  });

  afterAll(() => {
    if (originalDetailSyncDelay === undefined) {
      delete process.env.ALPHA_VANTAGE_DETAIL_SYNC_DELAY_MS;
      return;
    }

    process.env.ALPHA_VANTAGE_DETAIL_SYNC_DELAY_MS = originalDetailSyncDelay;
  });

  it('synchronizes metadata, current quote and historical prices', async () => {
    detailService.getInstrumentDetail
      .mockResolvedValueOnce({
        ...detail,
        metadataUpdatedAt: null,
        quote: null,
      })
      .mockResolvedValueOnce(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    metadataSyncService.synchronizeMetadata.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-overview-compatible',
      symbol: 'AAPL',
      preservedLastKnownMetadata: false,
      message: 'Synchronized metadata for AAPL',
      instrument: detail,
    });
    marketDataSyncService.synchronizeMarketData.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-compatible',
      updatedQuotes: [detail.quote],
      failedSymbols: [],
      preservedLastKnownData: false,
      message: 'Synchronized 1 of 1 market quotes',
    });
    quoteHistorySyncService.synchronizePriceHistory.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-history-compatible',
      symbol: 'AAPL',
      updatedCount: 100,
      preservedLocalHistory: false,
      prices: [detail.quote],
      message: 'Synchronized 100 historical price points for AAPL',
    });

    const result = await service.synchronizeInstrumentDetail(' aapl ');

    expect(result.status).toBe('SUCCESS');
    expect(result.symbol).toBe('AAPL');
    expect(result.instrument).toBe(detail);
    expect(result.metadata.status).toBe('SUCCESS');
    expect(result.quote.status).toBe('SUCCESS');
    expect(result.quote.updatedCount).toBe(1);
    expect(result.history.status).toBe('SUCCESS');
    expect(result.history.updatedCount).toBe(100);
    expect(marketDataSyncService.synchronizeMarketData).toHaveBeenCalledWith({
      symbols: ['AAPL'],
      requestedBy: 'instrument-detail-sync@nexus.local',
    });
  });

  it('stops provider synchronization when metadata fails', async () => {
    const incompleteDetail = {
      ...detail,
      metadataUpdatedAt: null,
      quote: null,
    };
    detailService.getInstrumentDetail.mockResolvedValue(incompleteDetail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    metadataSyncService.synchronizeMetadata.mockResolvedValue({
      status: 'FAILED',
      provider: 'alpha-vantage-overview-compatible',
      symbol: 'AAPL',
      preservedLastKnownMetadata: true,
      message: 'Metadata provider failed',
      instrument: detail,
    });

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('FAILED');
    expect(result.metadata.status).toBe('FAILED');
    expect(result.quote.message).toContain('skipped because metadata');
    expect(result.history.message).toContain('skipped because metadata');
    expect(marketDataSyncService.synchronizeMarketData).not.toHaveBeenCalled();
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).not.toHaveBeenCalled();
    expect(result.instrument).toBe(incompleteDetail);
  });

  it('stops historical synchronization when current quote fails', async () => {
    detailService.getInstrumentDetail
      .mockResolvedValueOnce({
        ...detail,
        metadataUpdatedAt: null,
        quote: null,
      })
      .mockResolvedValueOnce(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    metadataSyncService.synchronizeMetadata.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-overview-compatible',
      symbol: 'AAPL',
      preservedLastKnownMetadata: false,
      message: 'Synchronized metadata for AAPL',
      instrument: detail,
    });
    marketDataSyncService.synchronizeMarketData.mockResolvedValue({
      status: 'FAILED',
      provider: 'alpha-vantage-compatible',
      updatedQuotes: [],
      failedSymbols: ['AAPL'],
      preservedLastKnownData: true,
      message: 'Market data provider failed',
    });

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('PARTIAL_FAILURE');
    expect(result.metadata.status).toBe('SUCCESS');
    expect(result.quote.status).toBe('FAILED');
    expect(result.history.message).toContain('skipped because current quote');
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).not.toHaveBeenCalled();
  });

  it('reports current quote provider rejections and skips history sync', async () => {
    detailService.getInstrumentDetail
      .mockResolvedValueOnce({
        ...detail,
        metadataUpdatedAt: null,
        quote: null,
      })
      .mockResolvedValueOnce(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    metadataSyncService.synchronizeMetadata.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-overview-compatible',
      symbol: 'AAPL',
      preservedLastKnownMetadata: false,
      message: 'Synchronized metadata for AAPL',
      instrument: detail,
    });
    marketDataSyncService.synchronizeMarketData.mockRejectedValue(
      new Error('quote timeout'),
    );

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('PARTIAL_FAILURE');
    expect(result.quote).toEqual({
      status: 'FAILED',
      provider: 'market-data-provider',
      message: 'Current quote synchronization failed: quote timeout',
    });
    expect(result.history.message).toContain('skipped because current quote');
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).not.toHaveBeenCalled();
  });

  it('reports history provider rejections while preserving metadata and quote', async () => {
    detailService.getInstrumentDetail
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    quoteHistorySyncService.synchronizePriceHistory.mockRejectedValue(
      new Error('history timeout'),
    );

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('PARTIAL_FAILURE');
    expect(result.metadata.status).toBe('SUCCESS');
    expect(result.quote.status).toBe('SUCCESS');
    expect(result.history).toEqual({
      status: 'FAILED',
      provider: 'market-history-provider',
      message: 'Historical prices synchronization failed: history timeout',
    });
    expect(metadataSyncService.synchronizeMetadata).not.toHaveBeenCalled();
    expect(marketDataSyncService.synchronizeMarketData).not.toHaveBeenCalled();
  });

  it('uses local-cache provider labels when cached detail has no provider names', async () => {
    const cachedDetail = {
      ...detail,
      metadataProvider: null,
      quote: {
        ...detail.quote,
        provider: null,
      },
    };
    detailService.getInstrumentDetail.mockResolvedValue(cachedDetail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: Array.from({ length: 10 }, () => detail.quote),
    });

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('SUCCESS');
    expect(result.metadata.provider).toBe('local-cache');
    expect(result.quote.provider).toBe('local-cache');
  });

  it('returns failed and skips later provider steps when metadata rejects', async () => {
    const incompleteDetail = {
      ...detail,
      metadataUpdatedAt: null,
      quote: null,
    };
    detailService.getInstrumentDetail.mockResolvedValue(incompleteDetail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    metadataSyncService.synchronizeMetadata.mockRejectedValue(
      new Error('metadata timeout'),
    );

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('FAILED');
    expect(result.metadata).toEqual({
      status: 'FAILED',
      provider: 'instrument-metadata-provider',
      message: 'Instrument metadata synchronization failed: metadata timeout',
    });
    expect(result.quote).toEqual({
      status: 'FAILED',
      provider: 'market-data-provider',
      message:
        'Current quote synchronization skipped because metadata synchronization failed',
    });
    expect(result.history).toEqual({
      status: 'FAILED',
      provider: 'market-history-provider',
      message:
        'Historical prices synchronization skipped because metadata synchronization failed',
    });
    expect(marketDataSyncService.synchronizeMarketData).not.toHaveBeenCalled();
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).not.toHaveBeenCalled();
    expect(result.message).toContain('failed for AAPL');
    expect(result.instrument).toBe(incompleteDetail);
  });

  it('keeps a generic failure message when provider rejection is not an error', async () => {
    const incompleteDetail = {
      ...detail,
      metadataUpdatedAt: null,
      quote: null,
    };
    detailService.getInstrumentDetail.mockResolvedValue(incompleteDetail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: [],
    });
    metadataSyncService.synchronizeMetadata.mockRejectedValue('timeout');

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('FAILED');
    expect(result.metadata).toEqual({
      status: 'FAILED',
      provider: 'instrument-metadata-provider',
      message: 'Instrument metadata synchronization failed',
    });
  });

  it('waits between provider calls when a positive delay is configured', async () => {
    process.env.ALPHA_VANTAGE_DETAIL_SYNC_DELAY_MS = '1';
    detailService.getInstrumentDetail
      .mockResolvedValueOnce({
        ...detail,
        metadataUpdatedAt: null,
        quote: null,
      })
      .mockResolvedValueOnce(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: Array.from({ length: 10 }, () => detail.quote),
    });
    metadataSyncService.synchronizeMetadata.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-overview-compatible',
      symbol: 'AAPL',
      preservedLastKnownMetadata: false,
      message: 'Synchronized metadata for AAPL',
      instrument: detail,
    });
    marketDataSyncService.synchronizeMarketData.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-compatible',
      updatedQuotes: [detail.quote],
      failedSymbols: [],
      preservedLastKnownData: false,
      message: 'Synchronized 1 of 1 market quotes',
    });

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('SUCCESS');
    expect(marketDataSyncService.synchronizeMarketData).toHaveBeenCalledTimes(
      1,
    );
  });

  it('returns local cached detail without calling providers when data is complete', async () => {
    detailService.getInstrumentDetail.mockResolvedValue(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: Array.from({ length: 10 }, () => detail.quote),
    });

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('SUCCESS');
    expect(result.message).toContain('loaded from local cache');
    expect(result.metadata.provider).toBe('alpha-vantage-overview-compatible');
    expect(result.quote.provider).toBe('alpha-vantage-compatible');
    expect(result.history.provider).toBe('local-cache');
    expect(metadataSyncService.synchronizeMetadata).not.toHaveBeenCalled();
    expect(marketDataSyncService.synchronizeMarketData).not.toHaveBeenCalled();
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).not.toHaveBeenCalled();
  });

  it('synchronizes only historical prices when local history has fewer than ten points', async () => {
    detailService.getInstrumentDetail
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(detail);
    quoteHistoryService.getPriceHistory.mockResolvedValue({
      symbol: 'AAPL',
      prices: Array.from({ length: 2 }, () => detail.quote),
    });
    quoteHistorySyncService.synchronizePriceHistory.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'alpha-vantage-history-compatible',
      symbol: 'AAPL',
      updatedCount: 100,
      preservedLocalHistory: false,
      prices: [detail.quote],
      message: 'Synchronized 100 historical price points for AAPL',
    });

    const result = await service.synchronizeInstrumentDetail('AAPL');

    expect(result.status).toBe('SUCCESS');
    expect(result.metadata.message).toContain(
      'metadata loaded from local cache',
    );
    expect(result.quote.message).toContain('quote loaded from local cache');
    expect(result.history.updatedCount).toBe(100);
    expect(metadataSyncService.synchronizeMetadata).not.toHaveBeenCalled();
    expect(marketDataSyncService.synchronizeMarketData).not.toHaveBeenCalled();
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).toHaveBeenCalledWith('AAPL');
  });

  it('rejects empty symbols before calling providers', async () => {
    await expect(
      service.synchronizeInstrumentDetail(undefined as unknown as string),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.synchronizeInstrumentDetail(' '),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(metadataSyncService.synchronizeMetadata).not.toHaveBeenCalled();
    expect(marketDataSyncService.synchronizeMarketData).not.toHaveBeenCalled();
    expect(
      quoteHistorySyncService.synchronizePriceHistory,
    ).not.toHaveBeenCalled();
  });
});
