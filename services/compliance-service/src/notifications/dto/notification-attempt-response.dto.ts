import { ApiProperty } from '@nestjs/swagger';

export class NotificationAttemptResponseDto {
  @ApiProperty({ example: 'ff48e529-61cd-487a-8ac2-91e8c0bbab67' })
  id!: string;

  @ApiProperty({ example: 'ORDER_STATUS' })
  category!: string;

  @ApiProperty({ example: 'EMAIL' })
  channel!: string;

  @ApiProperty({ example: 'SENT' })
  deliveryStatus!: string;

  @ApiProperty({ example: 'ORD-2026-0001' })
  entityId!: string;

  @ApiProperty({ example: '2026-05-27T15:30:00.000Z' })
  recordedAt!: string;
}
