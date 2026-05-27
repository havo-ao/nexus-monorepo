import { AuditEventsRepository } from '../../audit/repositories/audit-events.repository';
import { AuditService } from '../../audit/services/audit.service';
import { RestrictionsRepository } from '../repositories/restrictions.repository';
import { RestrictionsService } from './restrictions.service';

describe('RestrictionsService', () => {
  let service: RestrictionsService;

  beforeEach(() => {
    service = new RestrictionsService(
      new RestrictionsRepository(),
      new AuditService(new AuditEventsRepository()),
    );
  });

  it('allows clear traders and blocks restricted traders', () => {
    expect(
      service.validateOperation({
        traderId: 'trader-101',
        operation: 'CREATE_ORDER',
        sourceService: 'trading-service',
      }),
    ).toEqual(
      expect.objectContaining({
        allowed: true,
        status: 'CLEAR',
      }),
    );

    service.upsert('trader-101', {
      status: 'RESTRICTED',
      reason: 'Unusual activity.',
      updatedBy: 'compliance-1',
    });

    expect(service.countRestricted()).toBe(1);
    expect(
      service.validateOperation({
        traderId: 'trader-101',
        operation: 'CREATE_ORDER',
        sourceService: 'trading-service',
      }),
    ).toEqual({
      traderId: 'trader-101',
      operation: 'CREATE_ORDER',
      allowed: false,
      status: 'RESTRICTED',
      reason: 'Unusual activity.',
    });
  });
});
