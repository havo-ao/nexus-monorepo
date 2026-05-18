import { ApiProperty } from '@nestjs/swagger';

export class MarketQuoteResponseDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 189.42 })
  price: number;

  @ApiProperty({ example: 189.37 })
  bid: number;

  @ApiProperty({ example: 189.47 })
  ask: number;

  @ApiProperty({ example: 0.1 })
  spread: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'alpha-vantage-compatible' })
  provider: string;

  @ApiProperty({ example: '2026-05-14T14:00:00.000Z' })
  asOf: string;
}
