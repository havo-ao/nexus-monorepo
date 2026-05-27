import { ComplianceValidation } from '../entities/compliance-validation.entity';
import { InMemoryComplianceValidationRepository } from './in-memory-compliance-validation.repository';

describe('InMemoryComplianceValidationRepository', () => {
  it('records validation evidence', async () => {
    const repository = new InMemoryComplianceValidationRepository();
    const validation = new ComplianceValidation(
      '101',
      'CREATE_MARKET_BUY_ORDER',
      true,
      'CLEAR',
    );

    await expect(repository.record(validation)).resolves.toBe(validation);
    expect(repository.validations).toEqual([validation]);
  });
});
