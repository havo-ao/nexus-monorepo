import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { InstrumentsModule } from '../instruments/instruments.module';
import { QuotesModule } from '../quotes/quotes.module';
import { WatchlistsController } from './controllers/watchlists.controller';
import { InMemoryWatchlistsRepository } from './repositories/in-memory-watchlists.repository';
import { MysqlWatchlistsRepository } from './repositories/mysql-watchlists.repository';
import { WATCHLISTS_REPOSITORY } from './repositories/watchlists.repository';
import { WatchlistsService } from './services/watchlists.service';

@Module({
  imports: [DatabaseModule, InstrumentsModule, QuotesModule],
  controllers: [WatchlistsController],
  providers: [
    WatchlistsService,
    InMemoryWatchlistsRepository,
    MysqlWatchlistsRepository,
    {
      provide: WATCHLISTS_REPOSITORY,
      useFactory: (
        inMemoryRepository: InMemoryWatchlistsRepository,
        mysqlRepository: MysqlWatchlistsRepository,
      ) =>
        process.env.WATCHLISTS_REPOSITORY === 'mysql'
          ? mysqlRepository
          : inMemoryRepository,
      inject: [InMemoryWatchlistsRepository, MysqlWatchlistsRepository],
    },
  ],
})
export class WatchlistsModule {}
