import { ApiProperty } from '@nestjs/swagger';
import type { MarketOperatingStatus } from '../entities/market-hours.entity';

export class ConfigureMarketRestrictionDto {
  @ApiProperty({ example: '2026-05-25' })
  date: string;

  @ApiProperty({ enum: ['CLOSED', 'RESTRICTED'], example: 'CLOSED' })
  status: Exclude<MarketOperatingStatus, 'OPEN'>;

  @ApiProperty({ example: 'Memorial Day market holiday' })
  reason: string;

  @ApiProperty({ example: 'admin@nexus.local' })
  actor: string;
}
