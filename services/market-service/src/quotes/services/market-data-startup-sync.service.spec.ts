import { MarketDataSyncService } from './market-data-sync.service';
import { MarketDataStartupSyncService } from './market-data-startup-sync.service';

describe('MarketDataStartupSyncService', () => {
  const originalStartupSync = process.env.MARKET_DATA_SYNC_ON_STARTUP;
  let synchronizeMarketData: jest.Mock;
  let marketDataSyncService: jest.Mocked<MarketDataSyncService>;
  let service: MarketDataStartupSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    synchronizeMarketData = jest.fn();
    marketDataSyncService = {
      synchronizeMarketData,
    } as unknown as jest.Mocked<MarketDataSyncService>;
    service = new MarketDataStartupSyncService(marketDataSyncService);
    delete process.env.MARKET_DATA_SYNC_ON_STARTUP;
  });

  afterAll(() => {
    process.env.MARKET_DATA_SYNC_ON_STARTUP = originalStartupSync;
  });

  it('does not synchronize when startup sync is disabled', async () => {
    await service.onApplicationBootstrap();

    expect(synchronizeMarketData).not.toHaveBeenCalled();
  });

  it('synchronizes market data during application startup when enabled', async () => {
    process.env.MARKET_DATA_SYNC_ON_STARTUP = 'true';
    synchronizeMarketData.mockResolvedValue({
      status: 'SUCCESS',
      provider: 'test-provider',
      updatedQuotes: [],
      failedSymbols: [],
      preservedLastKnownData: false,
      message: 'Synchronized 0 of 0 market quotes',
    });

    await service.onApplicationBootstrap();

    expect(synchronizeMarketData).toHaveBeenCalledWith({
      requestedBy: 'startup@nexus.local',
    });
  });

  it('handles startup synchronization failures without blocking startup', async () => {
    process.env.MARKET_DATA_SYNC_ON_STARTUP = 'true';
    synchronizeMarketData.mockRejectedValue(new Error('provider timeout'));

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});
