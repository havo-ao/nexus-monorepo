import { ApiProperty } from '@nestjs/swagger';
import type { MarketOperatingStatus } from '../entities/market-hours.entity';

export class MarketStatusResponseDto {
  @ApiProperty({ example: 'NYSE' })
  marketCode: string;

  @ApiProperty({ enum: ['OPEN', 'CLOSED', 'RESTRICTED'], example: 'OPEN' })
  status: MarketOperatingStatus;

  @ApiProperty({ example: true })
  canProcessOrder: boolean;

  @ApiProperty({ example: '2026-05-11T14:00:00.000Z' })
  evaluatedAt: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ example: 'Market is open for trading' })
  reason: string;
}
