import { ApiProperty } from '@nestjs/swagger';

export class PortfolioPositionResponseDto {
  @ApiProperty({ example: '1' })
  positionId!: string;

  @ApiProperty({ example: '25' })
  stockId!: string;

  @ApiProperty({ example: 'AAPL', nullable: true })
  symbol!: string | null;

  @ApiProperty({ example: 10 })
  quantity!: number;

  @ApiProperty({ example: 152.35 })
  averageBuyPrice!: number;

  @ApiProperty({ example: 1523.5 })
  totalInvested!: number;

  @ApiProperty({ example: 189.42, nullable: true })
  currentPrice!: number | null;

  @ApiProperty({ example: 1894.2, nullable: true })
  currentValue!: number | null;

  @ApiProperty({ example: 370.7, nullable: true })
  profitLoss!: number | null;

  @ApiProperty({ example: 24.3321, nullable: true })
  returnPercentage!: number | null;

  @ApiProperty({ example: '2026-05-10T22:15:00.000Z' })
  lastUpdated!: string;
}
