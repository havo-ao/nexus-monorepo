import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletDepositResponseDto {
  @ApiProperty({ example: '9001' })
  movementId!: string;

  @ApiProperty({ example: '101' })
  traderId!: string;

  @ApiProperty({ example: 250 })
  amount!: number;

  @ApiProperty({ example: 1250 })
  availableBalance!: number;

  @ApiProperty({ example: 0 })
  reservedBalance!: number;

  @ApiProperty({ example: 1250 })
  totalBalance!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'DEPOSIT' })
  movementType!: 'DEPOSIT';

  @ApiPropertyOptional({ example: 'pay_123456' })
  sourceTransactionId?: string;

  @ApiProperty({ example: '2026-05-21T22:15:00.000Z' })
  createdAt!: string;
}
