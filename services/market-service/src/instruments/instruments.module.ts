import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotesModule } from '../quotes/quotes.module';
import { InstrumentsController } from './controllers/instruments.controller';
import { AlphaVantageInstrumentCatalogProvider } from './providers/alpha-vantage-instrument-catalog.provider';
import { selectInstrumentCatalogProvider } from './providers/instrument-catalog-provider.factory';
import { INSTRUMENT_CATALOG_PROVIDER } from './providers/instrument-catalog.provider';
import { StaticInstrumentCatalogProvider } from './providers/static-instrument-catalog.provider';
import { InMemoryInstrumentsRepository } from './repositories/in-memory-instruments.repository';
import { INSTRUMENTS_REPOSITORY } from './repositories/instruments.repository';
import { MysqlInstrumentsRepository } from './repositories/mysql-instruments.repository';
import { InstrumentDetailService } from './services/instrument-detail.service';
import { InstrumentsSyncService } from './services/instruments-sync.service';
import { InstrumentsService } from './services/instruments.service';

@Module({
  imports: [DatabaseModule, QuotesModule],
  controllers: [InstrumentsController],
  providers: [
    InstrumentsService,
    InstrumentDetailService,
    InstrumentsSyncService,
    AlphaVantageInstrumentCatalogProvider,
    StaticInstrumentCatalogProvider,
    InMemoryInstrumentsRepository,
    MysqlInstrumentsRepository,
    {
      provide: INSTRUMENT_CATALOG_PROVIDER,
      useFactory: selectInstrumentCatalogProvider,
      inject: [
        StaticInstrumentCatalogProvider,
        AlphaVantageInstrumentCatalogProvider,
      ],
    },
    {
      provide: INSTRUMENTS_REPOSITORY,
      useFactory: (
        inMemoryRepository: InMemoryInstrumentsRepository,
        mysqlRepository: MysqlInstrumentsRepository,
      ) =>
        process.env.INSTRUMENTS_REPOSITORY === 'mysql'
          ? mysqlRepository
          : inMemoryRepository,
      inject: [InMemoryInstrumentsRepository, MysqlInstrumentsRepository],
    },
  ],
  exports: [INSTRUMENTS_REPOSITORY],
})
export class InstrumentsModule {}
