import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { ComplianceRestrictionStatus } from '../entities/restriction.entity';

const restrictionStatuses = ['CLEAR', 'RESTRICTED'] as const;

export class UpsertRestrictionDto {
  @ApiProperty({ enum: restrictionStatuses, example: 'RESTRICTED' })
  @IsEnum(restrictionStatuses)
  status!: ComplianceRestrictionStatus;

  @ApiPropertyOptional({ example: 'Unusual activity under review.' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 'compliance-officer-1' })
  @IsString()
  @IsNotEmpty()
  updatedBy!: string;
}
