import type { ComplianceValidation } from '../entities/compliance-validation.entity';

export const COMPLIANCE_VALIDATION_REPOSITORY = Symbol(
  'COMPLIANCE_VALIDATION_REPOSITORY',
);

export interface ComplianceValidationRepository {
  record(validation: ComplianceValidation): Promise<ComplianceValidation>;
}
