import { ApiProperty } from '@nestjs/swagger';
import { PortfolioPositionResponseDto } from './portfolio-position-response.dto';

export class PortfolioSummaryResponseDto {
  @ApiProperty({ example: '7' })
  traderId!: string;

  @ApiProperty({ type: [PortfolioPositionResponseDto] })
  positions!: PortfolioPositionResponseDto[];

  @ApiProperty({ example: 1523.5 })
  totalInvested!: number;

  @ApiProperty({ example: 1894.2, nullable: true })
  currentValue!: number | null;
}
