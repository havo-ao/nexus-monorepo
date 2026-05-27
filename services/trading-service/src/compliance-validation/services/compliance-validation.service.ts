import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  COMPLIANCE_RESTRICTIONS_CLIENT,
  type ComplianceRestrictionsClient,
} from '../clients/compliance-restrictions.client';
import type { ComplianceValidationOperation } from '../entities/compliance-validation.entity';
import {
  COMPLIANCE_VALIDATION_REPOSITORY,
  type ComplianceValidationRepository,
} from '../repositories/compliance-validation.repository';

@Injectable()
export class ComplianceValidationService {
  constructor(
    @Inject(COMPLIANCE_RESTRICTIONS_CLIENT)
    private readonly complianceClient: ComplianceRestrictionsClient,
    @Inject(COMPLIANCE_VALIDATION_REPOSITORY)
    private readonly complianceValidationRepository: ComplianceValidationRepository,
  ) {}

  async assertOperationAllowed(
    traderId: string,
    operation: ComplianceValidationOperation,
  ): Promise<void> {
    const validation = await this.complianceClient.validateOperation({
      traderId: traderId.trim(),
      operation,
    });

    await this.complianceValidationRepository.record(validation);

    if (!validation.allowed) {
      throw new ConflictException(
        validation.reason ?? 'Trading operation is restricted by compliance',
      );
    }
  }
}
