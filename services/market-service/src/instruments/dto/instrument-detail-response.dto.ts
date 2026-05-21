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

  @ApiPropertyOptional({ example: 'Common Stock', nullable: true })
  assetType: string | null;

  @ApiPropertyOptional({ example: 'Consumer Electronics', nullable: true })
  industry: string | null;

  @ApiPropertyOptional({ example: 'USA', nullable: true })
  country: string | null;

  @ApiPropertyOptional({
    example:
      'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({ example: 'alpha-vantage-overview', nullable: true })
  metadataProvider: string | null;

  @ApiPropertyOptional({
    example: '2026-05-20T18:00:00.000Z',
    nullable: true,
  })
  metadataUpdatedAt: string | null;

  @ApiPropertyOptional({
    type: MarketQuoteResponseDto,
    nullable: true,
    description: 'Latest available quote for the instrument.',
  })
  quote: MarketQuoteResponseDto | null;
}
