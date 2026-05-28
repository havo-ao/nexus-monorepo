import { ApiProperty } from '@nestjs/swagger';

export class TimeOfDayDto {
  @ApiProperty({ example: 9, minimum: 0, maximum: 23 })
  hour: number;

  @ApiProperty({ example: 30, minimum: 0, maximum: 59 })
  minute: number;
}

export class MarketDayScheduleDto {
  @ApiProperty({
    example: 1,
    minimum: 0,
    maximum: 6,
    description: 'Day of week where 0 is Sunday and 6 is Saturday.',
  })
  dayOfWeek: number;

  @ApiProperty({ example: true })
  isOpen: boolean;

  @ApiProperty({ type: TimeOfDayDto })
  openTime: TimeOfDayDto;

  @ApiProperty({ type: TimeOfDayDto })
  closeTime: TimeOfDayDto;
}

export class ConfigureMarketHoursDto {
  @ApiProperty({ example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ type: TimeOfDayDto })
  openTime: TimeOfDayDto;

  @ApiProperty({ type: TimeOfDayDto })
  closeTime: TimeOfDayDto;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: 'Operating days where 0 is Sunday and 6 is Saturday.',
  })
  operatingDays: number[];

  @ApiProperty({
    type: MarketDayScheduleDto,
    isArray: true,
    required: false,
    description:
      'Optional per-day schedule used when markets have different hours by weekday.',
  })
  weeklySchedule?: MarketDayScheduleDto[];

  @ApiProperty({ example: 'admin@nexus.local' })
  actor: string;
}
