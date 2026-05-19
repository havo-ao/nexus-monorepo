import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordExecutedSellDto {
  @ApiProperty({ example: '101' })
  traderId!: string;

  @ApiProperty({ example: '25' })
  stockId!: string;

  @ApiProperty({ example: 4 })
  quantity!: number;

  @ApiProperty({ example: 178.45 })
  executionPrice!: number;

  @ApiPropertyOptional({ example: '5002' })
  sourceOrderId?: string;

  @ApiPropertyOptional({ example: '7002' })
  sourceTransactionId?: string;

  @ApiPropertyOptional({ example: '2026-05-18T20:45:00.000Z' })
  executedAt?: string;
}
