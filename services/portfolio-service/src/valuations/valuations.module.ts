import { Module } from '@nestjs/common';
import { MarketInstrumentsClient } from './clients/market-instruments.client';
import { MarketQuotesClient } from './clients/market-quotes.client';
import { ValuationsService } from './services/valuations.service';

@Module({
  providers: [MarketInstrumentsClient, MarketQuotesClient, ValuationsService],
  exports: [ValuationsService],
})
export class ValuationsModule {}
