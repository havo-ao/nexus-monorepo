import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { MarketHoursModule } from './market-hours/market-hours.module';
import { MarketsModule } from './markets/markets.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { QuotesModule } from './quotes/quotes.module';
import { WatchlistsModule } from './watchlists/watchlists.module';

@Module({
  imports: [
    HealthModule,
    MarketHoursModule,
    MarketsModule,
    InstrumentsModule,
    QuotesModule,
    WatchlistsModule,
    PriceAlertsModule,
    DashboardModule,
  ],
})
export class AppModule {}
