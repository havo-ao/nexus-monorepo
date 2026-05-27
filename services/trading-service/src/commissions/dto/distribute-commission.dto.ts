import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DistributeCommissionDto {
  @ApiProperty({
    description: 'Trader identifier that generated the commission.',
    example: '101',
  })
  traderId!: string;

  @ApiProperty({
    description: 'Broker identifier that receives the broker commission share.',
    example: '201',
  })
  brokerId!: string;

  @ApiPropertyOptional({
    description: 'Order reference when the distribution is linked to an order.',
    example: 'order-reference',
  })
  orderReference?: string;

  @ApiProperty({
    description: 'Commission amount to distribute.',
    example: 2.63,
  })
  commissionAmount!: number;

  @ApiPropertyOptional({
    description: 'Currency for the distribution. Defaults to USD.',
    example: 'USD',
  })
  currency?: string;
}
