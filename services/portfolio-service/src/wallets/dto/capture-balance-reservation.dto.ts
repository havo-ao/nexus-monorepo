import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaptureBalanceReservationDto {
  @ApiProperty({ example: 450 })
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;

  @ApiPropertyOptional({ example: 'order_123456' })
  sourceOrderId?: string;

  @ApiPropertyOptional({ example: '2026-05-22T14:15:00.000Z' })
  capturedAt?: string;
}
