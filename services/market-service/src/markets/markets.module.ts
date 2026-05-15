import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MarketsController } from './controllers/markets.controller';
import { InMemoryMarketsRepository } from './repositories/in-memory-markets.repository';
import { MARKETS_REPOSITORY } from './repositories/markets.repository';
import { MysqlMarketsRepository } from './repositories/mysql-markets.repository';
import { MarketsService } from './services/markets.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketsController],
  providers: [
    MarketsService,
    InMemoryMarketsRepository,
    MysqlMarketsRepository,
    {
      provide: MARKETS_REPOSITORY,
      useFactory: (
        inMemoryRepository: InMemoryMarketsRepository,
        mysqlRepository: MysqlMarketsRepository,
      ) =>
        process.env.MARKETS_REPOSITORY === 'mysql'
          ? mysqlRepository
          : inMemoryRepository,
      inject: [InMemoryMarketsRepository, MysqlMarketsRepository],
    },
  ],
})
export class MarketsModule {}
