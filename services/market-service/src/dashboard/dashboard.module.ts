import { Module } from '@nestjs/common';
import { InstrumentsModule } from '../instruments/instruments.module';
import { MarketsModule } from '../markets/markets.module';
import { QuotesModule } from '../quotes/quotes.module';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [MarketsModule, InstrumentsModule, QuotesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
