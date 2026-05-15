import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MarketDataSyncController } from './controllers/market-data-sync.controller';
import { QuoteQueryController } from './controllers/quote-query.controller';
import { MARKET_DATA_PROVIDER } from './providers/market-data-provider';
import { StaticMarketDataProvider } from './providers/static-market-data.provider';
import { InMemoryQuotesRepository } from './repositories/in-memory-quotes.repository';
import { MysqlQuotesRepository } from './repositories/mysql-quotes.repository';
import { QUOTES_REPOSITORY } from './repositories/quotes.repository';
import { MarketDataSyncService } from './services/market-data-sync.service';
import { QuoteQueryService } from './services/quote-query.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketDataSyncController, QuoteQueryController],
  providers: [
    MarketDataSyncService,
    QuoteQueryService,
    StaticMarketDataProvider,
    InMemoryQuotesRepository,
    MysqlQuotesRepository,
    {
      provide: MARKET_DATA_PROVIDER,
      useExisting: StaticMarketDataProvider,
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
})
export class QuotesModule {}
