import { ApiProperty } from '@nestjs/swagger';

export class PortfolioSectorDistributionItemDto {
  @ApiProperty({ example: 'Technology' })
  sector!: string;

  @ApiProperty({ example: 1894.2 })
  value!: number;

  @ApiProperty({ example: 100 })
  percentage!: number;

  @ApiProperty({ example: 1 })
  positions!: number;
}
