import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecordOrderHistoryEventDto {
  @ApiProperty({ example: 'ORD-2026-0001' })
  @IsString()
  @IsNotEmpty()
  orderReference!: string;

  @ApiPropertyOptional({ example: 'PENDING_EXECUTION' })
  @IsOptional()
  @IsString()
  fromStatus?: string;

  @ApiProperty({ example: 'SENT_TO_BROKER' })
  @IsString()
  @IsNotEmpty()
  toStatus!: string;

  @ApiProperty({ example: 'broker-15' })
  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @ApiPropertyOptional({ example: 'BROKER' })
  @IsOptional()
  @IsString()
  actorRole?: string;

  @ApiProperty({ example: 'Broker approved the order for execution.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'trading-service' })
  @IsString()
  @IsNotEmpty()
  sourceService!: string;

  @ApiPropertyOptional({ example: 'corr-2026-0001' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ example: '2026-05-27T15:30:00.000Z' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
