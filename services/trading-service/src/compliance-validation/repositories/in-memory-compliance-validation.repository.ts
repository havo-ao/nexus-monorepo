import { Injectable } from '@nestjs/common';
import type { ComplianceValidation } from '../entities/compliance-validation.entity';
import type { ComplianceValidationRepository } from './compliance-validation.repository';

@Injectable()
export class InMemoryComplianceValidationRepository implements ComplianceValidationRepository {
  readonly validations: ComplianceValidation[] = [];

  record(validation: ComplianceValidation): Promise<ComplianceValidation> {
    this.validations.push(validation);
    return Promise.resolve(validation);
  }
}
