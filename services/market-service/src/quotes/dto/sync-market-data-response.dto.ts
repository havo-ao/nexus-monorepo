import { ApiProperty } from '@nestjs/swagger';
import { MarketQuoteResponseDto } from './market-quote-response.dto';

export class SyncMarketDataResponseDto {
  @ApiProperty({
    example: 'SUCCESS',
    enum: ['SUCCESS', 'PARTIAL_FAILURE', 'FAILED'],
  })
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';

  @ApiProperty({ example: 'alpha-vantage-compatible' })
  provider: string;

  @ApiProperty({ type: [MarketQuoteResponseDto] })
  updatedQuotes: MarketQuoteResponseDto[];

  @ApiProperty({ example: ['FAIL'] })
  failedSymbols: string[];

  @ApiProperty({ example: true })
  preservedLastKnownData: boolean;

  @ApiProperty({ example: 'Synchronized 3 of 3 market quotes' })
  message: string;
}
