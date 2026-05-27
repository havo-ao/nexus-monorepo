import { BrokerOrderValidationService } from '../services/broker-order-validation.service';
import { BrokerOrderValidationController } from './broker-order-validation.controller';

describe('BrokerOrderValidationController', () => {
  it('delegates broker validation to the service', async () => {
    const service = {
      validateOrder: jest.fn().mockResolvedValue({
        orderId: '1',
        orderReference: 'order-reference',
        brokerId: '201',
        decision: 'APPROVE',
        status: 'PENDING_EXECUTION',
        reason: 'Reviewed',
        validatedAt: '2026-05-26T14:30:00.000Z',
      }),
    } as unknown as jest.Mocked<BrokerOrderValidationService>;
    const controller = new BrokerOrderValidationController(service);

    await expect(
      controller.validate('order-reference', {
        brokerId: '201',
        decision: 'APPROVE',
        reason: 'Reviewed',
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      decision: 'APPROVE',
    });
    expect(service.validateOrder.mock.calls[0][0]).toEqual({
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'APPROVE',
      reason: 'Reviewed',
    });
  });
});
