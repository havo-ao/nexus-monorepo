import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletReservationResponseDto {
  @ApiProperty({ example: '9101' })
  movementId!: string;

  @ApiProperty({ example: '101' })
  traderId!: string;

  @ApiProperty({ example: 450 })
  amount!: number;

  @ApiProperty({ example: 550 })
  availableBalance!: number;

  @ApiProperty({ example: 450 })
  reservedBalance!: number;

  @ApiProperty({ example: 1000 })
  totalBalance!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'RESERVE', enum: ['RESERVE', 'RELEASE'] })
  movementType!: 'RESERVE' | 'RELEASE';

  @ApiPropertyOptional({ example: 'order_123456' })
  sourceOrderId?: string;

  @ApiProperty({ example: '2026-05-22T14:15:00.000Z' })
  createdAt!: string;
}
