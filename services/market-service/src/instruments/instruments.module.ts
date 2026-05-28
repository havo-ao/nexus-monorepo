import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotesModule } from '../quotes/quotes.module';
import { InstrumentsController } from './controllers/instruments.controller';
import { AlphaVantageInstrumentCatalogProvider } from './providers/alpha-vantage-instrument-catalog.provider';
import { AlphaVantageInstrumentMetadataProvider } from './providers/alpha-vantage-instrument-metadata.provider';
import { selectInstrumentCatalogProvider } from './providers/instrument-catalog-provider.factory';
import { INSTRUMENT_CATALOG_PROVIDER } from './providers/instrument-catalog.provider';
import { selectInstrumentMetadataProvider } from './providers/instrument-metadata-provider.factory';
import { INSTRUMENT_METADATA_PROVIDER } from './providers/instrument-metadata.provider';
import { StaticInstrumentCatalogProvider } from './providers/static-instrument-catalog.provider';
import { StaticInstrumentMetadataProvider } from './providers/static-instrument-metadata.provider';
import { InMemoryInstrumentsRepository } from './repositories/in-memory-instruments.repository';
import { INSTRUMENTS_REPOSITORY } from './repositories/instruments.repository';
import { MysqlInstrumentsRepository } from './repositories/mysql-instruments.repository';
import { InstrumentDetailService } from './services/instrument-detail.service';
import { InstrumentDetailSyncService } from './services/instrument-detail-sync.service';
import { InstrumentMetadataSyncService } from './services/instrument-metadata-sync.service';
import { InstrumentsSyncService } from './services/instruments-sync.service';
import { InstrumentsService } from './services/instruments.service';

@Module({
  imports: [DatabaseModule, QuotesModule],
  controllers: [InstrumentsController],
  providers: [
    InstrumentsService,
    InstrumentDetailService,
    InstrumentDetailSyncService,
    InstrumentMetadataSyncService,
    InstrumentsSyncService,
    AlphaVantageInstrumentCatalogProvider,
    AlphaVantageInstrumentMetadataProvider,
    StaticInstrumentCatalogProvider,
    StaticInstrumentMetadataProvider,
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
      provide: INSTRUMENT_METADATA_PROVIDER,
      useFactory: selectInstrumentMetadataProvider,
      inject: [
        StaticInstrumentMetadataProvider,
        AlphaVantageInstrumentMetadataProvider,
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
