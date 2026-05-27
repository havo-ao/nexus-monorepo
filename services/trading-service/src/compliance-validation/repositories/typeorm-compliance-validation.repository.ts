import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ComplianceValidation } from '../entities/compliance-validation.entity';
import { ComplianceValidationEvent } from '../entities/compliance-validation-event.entity';
import type { ComplianceValidationRepository } from './compliance-validation.repository';

@Injectable()
export class TypeOrmComplianceValidationRepository implements ComplianceValidationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async record(
    validation: ComplianceValidation,
  ): Promise<ComplianceValidation> {
    const event = new ComplianceValidationEvent();
    event.traderId = validation.traderId;
    event.operation = validation.operation;
    event.allowed = validation.allowed;
    event.status = validation.status;
    event.reason = validation.reason;

    await this.dataSource.getRepository(ComplianceValidationEvent).save(event);

    return validation;
  }
}
