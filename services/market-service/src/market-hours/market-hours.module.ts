import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MarketHoursAdminController } from './controllers/market-hours-admin.controller';
import { MarketHoursController } from './controllers/market-hours.controller';
import { InMemoryMarketHoursRepository } from './repositories/in-memory-market-hours.repository';
import { MARKET_HOURS_REPOSITORY } from './repositories/market-hours.repository';
import { MysqlMarketHoursRepository } from './repositories/mysql-market-hours.repository';
import { MarketHoursAdminService } from './services/market-hours-admin.service';
import { MarketHoursService } from './services/market-hours.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketHoursController, MarketHoursAdminController],
  providers: [
    MarketHoursService,
    MarketHoursAdminService,
    InMemoryMarketHoursRepository,
    MysqlMarketHoursRepository,
    {
      provide: MARKET_HOURS_REPOSITORY,
      useFactory: (
        inMemoryRepository: InMemoryMarketHoursRepository,
        mysqlRepository: MysqlMarketHoursRepository,
      ) =>
        process.env.MARKET_HOURS_REPOSITORY === 'mysql'
          ? mysqlRepository
          : inMemoryRepository,
      inject: [InMemoryMarketHoursRepository, MysqlMarketHoursRepository],
    },
  ],
})
export class MarketHoursModule {}
