import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletWithdrawalResponseDto {
  @ApiProperty({ example: '9201' })
  movementId!: string;

  @ApiProperty({ example: '101' })
  traderId!: string;

  @ApiProperty({ example: 150 })
  amount!: number;

  @ApiProperty({ example: 850 })
  availableBalance!: number;

  @ApiProperty({ example: 0 })
  reservedBalance!: number;

  @ApiProperty({ example: 850 })
  totalBalance!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'WITHDRAWAL' })
  movementType!: 'WITHDRAWAL';

  @ApiPropertyOptional({ example: 'wd_123456' })
  sourceTransactionId?: string;

  @ApiProperty({ example: '2026-05-23T16:20:00.000Z' })
  createdAt!: string;
}
