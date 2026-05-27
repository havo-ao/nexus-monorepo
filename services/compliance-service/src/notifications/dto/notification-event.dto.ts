import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { NotificationCategory } from '../entities/notification-attempt.entity';

const notificationCategories = [
  'ORDER_STATUS',
  'MARKET_ALERT',
  'PORTFOLIO_CHANGE',
  'SECURITY',
  'ONBOARDING',
] as const;

export class NotificationRecipientDto {
  @ApiProperty({ example: 'trader@nexus.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Andy' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Trader' })
  @IsString()
  @IsNotEmpty()
  surname!: string;

  @ApiProperty({ example: 'andytrader' })
  @IsString()
  @IsNotEmpty()
  username!: string;
}

export class NotificationEventDto {
  @ApiProperty({ enum: notificationCategories, example: 'ORDER_STATUS' })
  @IsEnum(notificationCategories)
  category!: NotificationCategory;

  @ApiProperty({ example: 'trading-service' })
  @IsString()
  @IsNotEmpty()
  sourceService!: string;

  @ApiProperty({ example: 'ORDER' })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiProperty({ example: 'ORD-2026-0001' })
  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({ example: 'Order status changed to SENT_TO_BROKER' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Your order was approved and sent to Alpaca.' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ type: NotificationRecipientDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationRecipientDto)
  recipient?: NotificationRecipientDto;

  @ApiPropertyOptional({ example: 'corr-2026-0001' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ example: { status: 'SENT_TO_BROKER' } })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2026-05-27T15:30:00.000Z' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
