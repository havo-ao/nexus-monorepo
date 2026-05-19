import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MarketDataSyncController } from './controllers/market-data-sync.controller';
import { QuoteHistoryController } from './controllers/quote-history.controller';
import { QuoteQueryController } from './controllers/quote-query.controller';
import { AlphaVantageMarketHistoryProvider } from './providers/alpha-vantage-market-history.provider';
import { AlphaVantageMarketDataProvider } from './providers/alpha-vantage-market-data.provider';
import { selectMarketHistoryProvider } from './providers/market-history-provider.factory';
import { MARKET_HISTORY_PROVIDER } from './providers/market-history-provider';
import { selectMarketDataProvider } from './providers/market-data-provider.factory';
import { MARKET_DATA_PROVIDER } from './providers/market-data-provider';
import { StaticMarketHistoryProvider } from './providers/static-market-history.provider';
import { StaticMarketDataProvider } from './providers/static-market-data.provider';
import { InMemoryQuotesRepository } from './repositories/in-memory-quotes.repository';
import { MysqlQuotesRepository } from './repositories/mysql-quotes.repository';
import { QUOTES_REPOSITORY } from './repositories/quotes.repository';
import { MarketDataSyncService } from './services/market-data-sync.service';
import { MarketDataStartupSyncService } from './services/market-data-startup-sync.service';
import { QuoteHistorySyncService } from './services/quote-history-sync.service';
import { QuoteHistoryService } from './services/quote-history.service';
import { QuoteQueryService } from './services/quote-query.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    MarketDataSyncController,
    QuoteHistoryController,
    QuoteQueryController,
  ],
  providers: [
    MarketDataSyncService,
    MarketDataStartupSyncService,
    QuoteHistoryService,
    QuoteHistorySyncService,
    QuoteQueryService,
    AlphaVantageMarketHistoryProvider,
    AlphaVantageMarketDataProvider,
    StaticMarketHistoryProvider,
    StaticMarketDataProvider,
    InMemoryQuotesRepository,
    MysqlQuotesRepository,
    {
      provide: MARKET_DATA_PROVIDER,
      useFactory: selectMarketDataProvider,
      inject: [StaticMarketDataProvider, AlphaVantageMarketDataProvider],
    },
    {
      provide: MARKET_HISTORY_PROVIDER,
      useFactory: selectMarketHistoryProvider,
      inject: [StaticMarketHistoryProvider, AlphaVantageMarketHistoryProvider],
    },
    {
      provide: QUOTES_REPOSITORY,
      useFactory: (
        inMemoryRepository: InMemoryQuotesRepository,
        mysqlRepository: MysqlQuotesRepository,
      ) =>
        process.env.QUOTES_REPOSITORY === 'mysql'
          ? mysqlRepository
          : inMemoryRepository,
      inject: [InMemoryQuotesRepository, MysqlQuotesRepository],
    },
  ],
  exports: [QUOTES_REPOSITORY],
})
export class QuotesModule {}
