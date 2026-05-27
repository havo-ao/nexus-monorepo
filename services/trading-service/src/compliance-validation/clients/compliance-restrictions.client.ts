import type {
  ComplianceValidation,
  ComplianceValidationOperation,
} from '../entities/compliance-validation.entity';

export const COMPLIANCE_RESTRICTIONS_CLIENT = Symbol(
  'COMPLIANCE_RESTRICTIONS_CLIENT',
);

export type ValidateComplianceOperationCommand = {
  traderId: string;
  operation: ComplianceValidationOperation;
};

export interface ComplianceRestrictionsClient {
  validateOperation(
    command: ValidateComplianceOperationCommand,
  ): Promise<ComplianceValidation>;
}
