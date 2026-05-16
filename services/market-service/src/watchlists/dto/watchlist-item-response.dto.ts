import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketQuoteResponseDto } from '../../quotes/dto/market-quote-response.dto';

export class WatchlistItemResponseDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: '2026-05-16T14:00:00.000Z' })
  addedAt: string;

  @ApiPropertyOptional({
    type: MarketQuoteResponseDto,
    nullable: true,
    description: 'Latest available quote for the watched symbol.',
  })
  quote: MarketQuoteResponseDto | null;
}
