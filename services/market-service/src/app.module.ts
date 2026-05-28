import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { MarketHoursModule } from './market-hours/market-hours.module';
import { MarketsModule } from './markets/markets.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { QuotesModule } from './quotes/quotes.module';
import { WatchlistsModule } from './watchlists/watchlists.module';
import { JwtRoleGuard } from './auth/jwt-role.guard';

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
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtRoleGuard,
    },
  ],
})
export class AppModule {}
