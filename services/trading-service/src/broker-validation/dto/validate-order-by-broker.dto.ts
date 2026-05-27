import { ApiProperty } from '@nestjs/swagger';
import type { BrokerValidationDecision } from '../entities/broker-order-validation.entity';

export class ValidateOrderByBrokerDto {
  @ApiProperty({
    example: '201',
    description: 'Broker identifier that validates the order.',
  })
  brokerId!: string;

  @ApiProperty({
    example: 'APPROVE',
    enum: ['APPROVE', 'REJECT'],
    description: 'Broker validation decision.',
  })
  decision!: BrokerValidationDecision;

  @ApiProperty({
    example: 'Order reviewed by assigned broker.',
    required: false,
    description: 'Optional validation reason or rejection explanation.',
  })
  reason?: string;
}
