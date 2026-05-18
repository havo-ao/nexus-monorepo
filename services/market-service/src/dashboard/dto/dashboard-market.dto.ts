import { ApiProperty } from '@nestjs/swagger';

export class DashboardMarketDto {
  @ApiProperty({ example: 'NASDAQ' })
  code: string;

  @ApiProperty({ example: 'NASDAQ Stock Market' })
  name: string;

  @ApiProperty({ example: 'United States' })
  country: string;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
