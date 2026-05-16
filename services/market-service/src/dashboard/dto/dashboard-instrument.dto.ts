import { ApiProperty } from '@nestjs/swagger';

export class DashboardInstrumentDto {
  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 'Apple Inc.' })
  name: string;

  @ApiProperty({ example: 'NASDAQ' })
  marketCode: string;

  @ApiProperty({ example: 'Technology' })
  sector: string;
}
