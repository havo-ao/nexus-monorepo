import { ApiProperty } from '@nestjs/swagger';

export class AuditEventResponseDto {
  @ApiProperty({ example: 'a7f0d8df-35de-4d97-a060-b8b2c3ddbb1b' })
  id!: string;

  @ApiProperty({ example: 'ORDER_STATUS_CHANGED' })
  eventType!: string;

  @ApiProperty({ example: 'trading-service' })
  sourceService!: string;

  @ApiProperty({ example: 'trader-101' })
  actorId!: string;

  @ApiProperty({ example: 'ORDER' })
  entityType!: string;

  @ApiProperty({ example: 'ORD-2026-0001' })
  entityId!: string;

  @ApiProperty({ example: 'SUCCESS' })
  result!: string;

  @ApiProperty({ example: false })
  critical!: boolean;

  @ApiProperty({ example: '2026-05-27T15:30:00.000Z' })
  occurredAt!: string;

  @ApiProperty({ example: '2026-05-27T15:30:00.000Z' })
  recordedAt!: string;
}
