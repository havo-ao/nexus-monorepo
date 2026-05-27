import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Identifier of the trader requesting cancellation.',
    example: '101',
  })
  actorId!: string;

  @ApiPropertyOptional({
    description: 'Optional cancellation reason recorded in the audit trail.',
    example: 'Trader requested cancellation before execution',
  })
  reason?: string;
}
