import { Module } from '@nestjs/common';
import { MarketQuotesClient } from './clients/market-quotes.client';
import { ValuationsService } from './services/valuations.service';

@Module({
  providers: [MarketQuotesClient, ValuationsService],
  exports: [ValuationsService],
})
export class ValuationsModule {}
