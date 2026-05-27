import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { AuditResult } from '../entities/audit-event.entity';

const auditResults = ['SUCCESS', 'FAILURE', 'PENDING', 'INFO'] as const;

export class CreateAuditEventDto {
  @ApiProperty({ example: 'ORDER_STATUS_CHANGED' })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ example: 'trading-service' })
  @IsString()
  @IsNotEmpty()
  sourceService!: string;

  @ApiProperty({ example: 'trader-101' })
  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @ApiPropertyOptional({ example: 'TRADER' })
  @IsOptional()
  @IsString()
  actorRole?: string;

  @ApiProperty({ example: 'ORDER' })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiProperty({ example: 'ORD-2026-0001' })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiPropertyOptional({ example: 'corr-2026-0001' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ enum: auditResults, example: 'SUCCESS' })
  @IsEnum(auditResults)
  result!: AuditResult;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  critical?: boolean;

  @ApiPropertyOptional({
    example: { fromStatus: 'PENDING_EXECUTION', toStatus: 'SENT_TO_BROKER' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2026-05-27T15:30:00.000Z' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
