import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletHistoryItemDto {
  @ApiProperty({ example: '9102' })
  movementId!: string;

  @ApiProperty({ example: '7' })
  traderId!: string;

  @ApiProperty({ example: 'RELEASE' })
  movementType!: string;

  @ApiProperty({ example: 200 })
  amount!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiPropertyOptional({ example: 'pay_123456' })
  sourceTransactionId?: string;

  @ApiPropertyOptional({ example: 'order_123456' })
  sourceOrderId?: string;

  @ApiProperty({ example: '2026-05-22T14:30:00.000Z' })
  createdAt!: string;
}
