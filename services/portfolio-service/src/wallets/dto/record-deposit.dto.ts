import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordDepositDto {
  @ApiProperty({ example: 250 })
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;

  @ApiPropertyOptional({ example: 'pay_123456' })
  sourceTransactionId?: string;

  @ApiPropertyOptional({ example: '2026-05-21T22:15:00.000Z' })
  depositedAt?: string;
}
