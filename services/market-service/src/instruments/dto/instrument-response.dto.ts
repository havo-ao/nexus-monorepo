import { ApiProperty } from '@nestjs/swagger';

export class InstrumentResponseDto {
  @ApiProperty({ example: 'AAPL' })
  symbol!: string;

  @ApiProperty({ example: 'Apple Inc.' })
  name!: string;

  @ApiProperty({ example: 'NASDAQ' })
  marketCode!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'Technology' })
  sector!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status!: string;
}
