import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { MarketHoursModule } from './market-hours/market-hours.module';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [HealthModule, MarketHoursModule, QuotesModule],
})
export class AppModule {}
