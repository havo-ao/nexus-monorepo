import { ApiProperty } from '@nestjs/swagger';

export class PriceAlertEventResponseDto {
  @ApiProperty({ example: 1 })
  alertId: number;

  @ApiProperty({ example: 'trader-123' })
  traderId: string;

  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 190 })
  targetPrice: number;

  @ApiProperty({ example: 191.25 })
  marketPrice: number;

  @ApiProperty({ example: 'ABOVE_OR_EQUAL' })
  condition: string;

  @ApiProperty({ example: '2026-05-16T13:00:00.000Z' })
  occurredAt: string;
}
