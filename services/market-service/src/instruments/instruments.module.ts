import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotesModule } from '../quotes/quotes.module';
import { InstrumentsController } from './controllers/instruments.controller';
import { InMemoryInstrumentsRepository } from './repositories/in-memory-instruments.repository';
import { INSTRUMENTS_REPOSITORY } from './repositories/instruments.repository';
import { MysqlInstrumentsRepository } from './repositories/mysql-instruments.repository';
import { InstrumentDetailService } from './services/instrument-detail.service';
import { InstrumentsService } from './services/instruments.service';

@Module({
  imports: [DatabaseModule, QuotesModule],
  controllers: [InstrumentsController],
  providers: [
    InstrumentsService,
    InstrumentDetailService,
    InMemoryInstrumentsRepository,
    MysqlInstrumentsRepository,
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
})
export class InstrumentsModule {}
