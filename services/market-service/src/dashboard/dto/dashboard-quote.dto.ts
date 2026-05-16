import { ApiProperty } from '@nestjs/swagger';

export class DashboardQuoteDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 'Apple Inc.' })
  name: string;

  @ApiProperty({ example: 186.4 })
  price: number;

  @ApiProperty({ example: 1.88 })
  changePercent: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'alpha-vantage-compatible' })
  provider: string;

  @ApiProperty({ example: '2026-05-16T12:00:00.000Z' })
  asOf: string;
}
