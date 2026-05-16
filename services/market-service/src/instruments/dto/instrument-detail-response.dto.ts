import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketQuoteResponseDto } from '../../quotes/dto/market-quote-response.dto';

export class InstrumentDetailResponseDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 'Apple Inc.' })
  name: string;

  @ApiProperty({ example: 'NASDAQ' })
  marketCode: string;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'Technology' })
  sector: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiPropertyOptional({
    type: MarketQuoteResponseDto,
    nullable: true,
    description: 'Latest available quote for the instrument.',
  })
  quote: MarketQuoteResponseDto | null;
}
