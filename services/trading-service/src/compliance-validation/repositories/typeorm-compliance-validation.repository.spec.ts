import { ComplianceValidation } from '../entities/compliance-validation.entity';
import { ComplianceValidationEvent } from '../entities/compliance-validation-event.entity';
import { TypeOrmComplianceValidationRepository } from './typeorm-compliance-validation.repository';

describe('TypeOrmComplianceValidationRepository', () => {
  it('persists validation evidence as an event', async () => {
    const save = jest.fn().mockImplementation((event) =>
      Promise.resolve({
        ...event,
        id: '1',
      }),
    );
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({ save }),
    };
    const repository = new TypeOrmComplianceValidationRepository(
      dataSource as never,
    );
    const validation = new ComplianceValidation(
      '101',
      'CREATE_MARKET_BUY_ORDER',
      true,
      'CLEAR',
    );

    await expect(repository.record(validation)).resolves.toBe(validation);

    expect(dataSource.getRepository).toHaveBeenCalledWith(
      ComplianceValidationEvent,
    );
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        traderId: '101',
        operation: 'CREATE_MARKET_BUY_ORDER',
        allowed: true,
        status: 'CLEAR',
      }),
    );
  });
});
