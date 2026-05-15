import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { MarketHoursModule } from './market-hours/market-hours.module';
import { MarketsModule } from './markets/markets.module';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [HealthModule, MarketHoursModule, MarketsModule, QuotesModule],
})
export class AppModule {}
