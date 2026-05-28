import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty({ example: '101' })
  traderId!: string;

  @ApiProperty({ example: 1000 })
  availableBalance!: number;

  @ApiProperty({ example: 250 })
  reservedBalance!: number;

  @ApiProperty({ example: 1250 })
  totalBalance!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;
}
