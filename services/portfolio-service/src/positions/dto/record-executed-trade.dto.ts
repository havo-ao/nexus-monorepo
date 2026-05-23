import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordExecutedTradeDto {
  @ApiProperty({ example: '101' })
  traderId!: string;

  @ApiProperty({ example: '25' })
  stockId!: string;

  @ApiProperty({ example: 10 })
  quantity!: number;

  @ApiProperty({ example: 152.35 })
  executionPrice!: number;

  @ApiPropertyOptional({ example: '5001' })
  sourceOrderId?: string;

  @ApiPropertyOptional({ example: '7001' })
  sourceTransactionId?: string;

  @ApiPropertyOptional({ example: '2026-05-17T22:15:00.000Z' })
  executedAt?: string;
}
