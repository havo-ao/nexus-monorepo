import { Injectable } from '@nestjs/common';
import { ComplianceValidation } from '../entities/compliance-validation.entity';
import type {
  ComplianceRestrictionsClient,
  ValidateComplianceOperationCommand,
} from './compliance-restrictions.client';

@Injectable()
export class InMemoryComplianceRestrictionsClient implements ComplianceRestrictionsClient {
  private readonly restrictedTraderIds = new Set(['restricted-trader']);

  validateOperation(
    command: ValidateComplianceOperationCommand,
  ): Promise<ComplianceValidation> {
    const traderId = command.traderId.trim();
    const allowed = !this.restrictedTraderIds.has(traderId);

    return Promise.resolve(
      new ComplianceValidation(
        traderId,
        command.operation,
        allowed,
        allowed ? 'CLEAR' : 'RESTRICTED',
        allowed ? undefined : 'Trader is restricted by compliance',
      ),
    );
  }
}
