import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MarketDataSyncService } from './market-data-sync.service';

@Injectable()
export class MarketDataStartupSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarketDataStartupSyncService.name);

  constructor(private readonly marketDataSyncService: MarketDataSyncService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.MARKET_DATA_SYNC_ON_STARTUP !== 'true') {
      return;
    }

    try {
      const response = await this.marketDataSyncService.synchronizeMarketData({
        requestedBy: 'startup@nexus.local',
      });

      this.logger.log(
        `Startup market data sync completed with ${response.status}: ${response.message}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown startup sync error';

      this.logger.warn(`Startup market data sync skipped: ${message}`);
    }
  }
}
