import { ApiProperty } from '@nestjs/swagger';
import { MarketQuoteResponseDto } from './market-quote-response.dto';

export class SyncQuoteHistoryResponseDto {
  @ApiProperty({
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAILED'],
  })
  status: 'SUCCESS' | 'FAILED';

  @ApiProperty({ example: 'alpha-vantage' })
  provider: string;

  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 100 })
  updatedCount: number;

  @ApiProperty({ example: false })
  preservedLocalHistory: boolean;

  @ApiProperty({ type: [MarketQuoteResponseDto] })
  prices: MarketQuoteResponseDto[];

  @ApiProperty({
    example: 'Synchronized 100 historical price points for AAPL',
  })
  message: string;
}
