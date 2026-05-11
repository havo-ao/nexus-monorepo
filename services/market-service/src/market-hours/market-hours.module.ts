import { Module } from '@nestjs/common';
import { MarketHoursController } from './controllers/market-hours.controller';
import { InMemoryMarketHoursRepository } from './repositories/in-memory-market-hours.repository';
import { MARKET_HOURS_REPOSITORY } from './repositories/market-hours.repository';
import { MarketHoursService } from './services/market-hours.service';

@Module({
  controllers: [MarketHoursController],
  providers: [
    MarketHoursService,
    {
      provide: MARKET_HOURS_REPOSITORY,
      useClass: InMemoryMarketHoursRepository,
    },
  ],
})
export class MarketHoursModule {}
