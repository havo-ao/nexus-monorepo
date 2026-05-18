import { ApiProperty } from '@nestjs/swagger';
import { MarketStatusResponseDto } from './market-status-response.dto';

export class MarketRestrictionResponseDto {
  @ApiProperty({ example: '2026-05-25' })
  date: string;

  @ApiProperty({ enum: ['CLOSED', 'RESTRICTED'], example: 'CLOSED' })
  status: 'CLOSED' | 'RESTRICTED';

  @ApiProperty({ example: 'Memorial Day market holiday' })
  reason: string;
}

export class MarketHoursConfigurationResponseDto {
  @ApiProperty({ example: 'NYSE' })
  marketCode: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ example: { hour: 9, minute: 30 } })
  openTime: { hour: number; minute: number };

  @ApiProperty({ example: { hour: 16, minute: 0 } })
  closeTime: { hour: number; minute: number };

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  operatingDays: number[];

  @ApiProperty({ type: MarketRestrictionResponseDto, isArray: true })
  restrictions: MarketRestrictionResponseDto[];

  @ApiProperty({ type: MarketStatusResponseDto })
  currentStatus: MarketStatusResponseDto;
}
