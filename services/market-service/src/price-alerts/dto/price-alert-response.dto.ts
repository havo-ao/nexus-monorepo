import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  PriceAlertCondition,
  PriceAlertStatus,
} from '../entities/price-alert.entity';

export class PriceAlertResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'trader-123' })
  traderId: string;

  @ApiProperty({ example: 'AAPL' })
  symbol: string;

  @ApiProperty({ example: 190 })
  targetPrice: number;

  @ApiProperty({ example: 'ABOVE_OR_EQUAL' })
  condition: PriceAlertCondition;

  @ApiProperty({ example: 'ACTIVE' })
  status: PriceAlertStatus;

  @ApiProperty({ example: '2026-05-16T12:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ example: '2026-05-16T13:00:00.000Z', nullable: true })
  triggeredAt: string | null;
}
