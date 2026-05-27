import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessPendingOrdersDto {
  @ApiPropertyOptional({
    example: 25,
    description: 'Maximum number of pending orders to evaluate in this run.',
  })
  limit?: number;

  @ApiPropertyOptional({
    example: '2026-05-12T14:30:00.000Z',
    description:
      'Evaluation timestamp used for market-hours checks. Defaults to now.',
  })
  evaluatedAt?: string;
}
