import { ApiProperty } from '@nestjs/swagger';
import { PortfolioSectorDistributionItemDto } from './portfolio-sector-distribution-item.dto';

export class PortfolioSectorDistributionResponseDto {
  @ApiProperty({ example: '7' })
  traderId!: string;

  @ApiProperty({ example: 1894.2 })
  totalValue!: number;

  @ApiProperty({ type: [PortfolioSectorDistributionItemDto] })
  sectors!: PortfolioSectorDistributionItemDto[];
}
