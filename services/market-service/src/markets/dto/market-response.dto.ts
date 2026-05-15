import { ApiProperty } from '@nestjs/swagger';

export class MarketResponseDto {
  @ApiProperty({ example: 'NYSE' })
  code!: string;

  @ApiProperty({ example: 'New York Stock Exchange' })
  name!: string;

  @ApiProperty({ example: 'United States' })
  country!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status!: string;

  @ApiProperty({ example: ['AAPL', 'JPM', 'KO'] })
  representativeSymbols!: string[];
}
