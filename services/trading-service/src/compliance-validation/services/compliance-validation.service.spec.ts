import { ConflictException } from '@nestjs/common';
import {
  COMPLIANCE_RESTRICTIONS_CLIENT,
  type ComplianceRestrictionsClient,
} from '../clients/compliance-restrictions.client';
import { ComplianceValidation } from '../entities/compliance-validation.entity';
import {
  COMPLIANCE_VALIDATION_REPOSITORY,
  type ComplianceValidationRepository,
} from '../repositories/compliance-validation.repository';
import { ComplianceValidationService } from './compliance-validation.service';

describe('ComplianceValidationService', () => {
  let service: ComplianceValidationService;
  let client: jest.Mocked<ComplianceRestrictionsClient>;
  let repository: jest.Mocked<ComplianceValidationRepository>;

  beforeEach(() => {
    client = {
      validateOperation: jest.fn(),
    };
    repository = {
      record: jest.fn(),
    };
    service = new ComplianceValidationService(client, repository);
  });

  it('records allowed validations and lets the order continue', async () => {
    const validation = new ComplianceValidation(
      '101',
      'CREATE_MARKET_BUY_ORDER',
      true,
      'CLEAR',
    );
    client.validateOperation.mockResolvedValue(validation);
    repository.record.mockResolvedValue(validation);

    await expect(
      service.assertOperationAllowed(' 101 ', 'CREATE_MARKET_BUY_ORDER'),
    ).resolves.toBeUndefined();

    expect(client.validateOperation.mock.calls[0][0]).toEqual({
      traderId: '101',
      operation: 'CREATE_MARKET_BUY_ORDER',
    });
    expect(repository.record.mock.calls[0][0]).toBe(validation);
  });

  it('records blocked validations and rejects the order', async () => {
    const validation = new ComplianceValidation(
      '101',
      'CREATE_LIMIT_BUY_ORDER',
      false,
      'RESTRICTED',
      'Trader is restricted',
    );
    client.validateOperation.mockResolvedValue(validation);
    repository.record.mockResolvedValue(validation);

    await expect(
      service.assertOperationAllowed('101', 'CREATE_LIMIT_BUY_ORDER'),
    ).rejects.toThrow(ConflictException);

    expect(repository.record.mock.calls[0][0]).toBe(validation);
  });

  it('uses a generic conflict reason when compliance does not provide one', async () => {
    const validation = new ComplianceValidation(
      '101',
      'CREATE_LIMIT_BUY_ORDER',
      false,
      'RESTRICTED',
    );
    client.validateOperation.mockResolvedValue(validation);
    repository.record.mockResolvedValue(validation);

    await expect(
      service.assertOperationAllowed('101', 'CREATE_LIMIT_BUY_ORDER'),
    ).rejects.toThrow('Trading operation is restricted by compliance');
  });

  it('uses the injectable tokens expected by the module', () => {
    expect(COMPLIANCE_RESTRICTIONS_CLIENT.description).toBe(
      'COMPLIANCE_RESTRICTIONS_CLIENT',
    );
    expect(COMPLIANCE_VALIDATION_REPOSITORY.description).toBe(
      'COMPLIANCE_VALIDATION_REPOSITORY',
    );
  });
});
