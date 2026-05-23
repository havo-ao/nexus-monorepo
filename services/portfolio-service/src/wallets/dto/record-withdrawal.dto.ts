import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordWithdrawalDto {
  @ApiProperty({ example: 150 })
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;

  @ApiPropertyOptional({ example: 'wd_123456' })
  sourceTransactionId?: string;

  @ApiPropertyOptional({ example: '2026-05-23T16:20:00.000Z' })
  withdrawnAt?: string;
}
