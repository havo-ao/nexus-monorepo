import { ApiProperty } from '@nestjs/swagger';
import { MarketQuoteResponseDto } from './market-quote-response.dto';

export class MarketQuoteHistoryResponseDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ type: MarketQuoteResponseDto, isArray: true })
  prices: MarketQuoteResponseDto[];
}
