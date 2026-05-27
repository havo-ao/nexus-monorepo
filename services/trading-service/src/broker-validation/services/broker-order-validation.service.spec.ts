import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  type BrokerOrderValidationRepository,
  type BrokerValidatableOrder,
} from '../repositories/broker-order-validation.repository';
import { BrokerOrderValidationService } from './broker-order-validation.service';

describe('BrokerOrderValidationService', () => {
  let repository: jest.Mocked<BrokerOrderValidationRepository>;
  let service: BrokerOrderValidationService;

  beforeEach(() => {
    repository = {
      findOrderByReference: jest.fn(),
      saveValidation: jest.fn(),
    };
    service = new BrokerOrderValidationService(repository);
  });

  it('approves a pending order and keeps its operational status', async () => {
    const order = validatableOrder('PENDING_EXECUTION');
    repository.findOrderByReference.mockResolvedValue(order);
    repository.saveValidation.mockResolvedValue({
      orderId: '1',
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'APPROVE',
      status: 'PENDING_EXECUTION',
      reason: 'Reviewed',
      validatedAt: '2026-05-26T14:30:00.000Z',
    });

    await expect(
      service.validateOrder({
        orderReference: ' order-reference ',
        brokerId: ' 201 ',
        decision: 'APPROVE',
        reason: 'Reviewed',
      }),
    ).resolves.toMatchObject({
      decision: 'APPROVE',
      status: 'PENDING_EXECUTION',
    });
    expect(repository.saveValidation.mock.calls[0][0]).toEqual({
      order,
      brokerId: '201',
      decision: 'APPROVE',
      nextStatus: 'PENDING_EXECUTION',
      reason: 'Reviewed',
    });
  });

  it('rejects a pending order', async () => {
    const order = validatableOrder('PENDING_CONDITION');
    repository.findOrderByReference.mockResolvedValue(order);
    repository.saveValidation.mockResolvedValue({
      orderId: '1',
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'REJECT',
      status: 'REJECTED',
      reason: 'Risk policy',
      validatedAt: '2026-05-26T14:30:00.000Z',
    });

    await service.validateOrder({
      orderReference: 'order-reference',
      brokerId: '201',
      decision: 'REJECT',
      reason: 'Risk policy',
    });

    expect(repository.saveValidation.mock.calls[0][0]).toEqual({
      order,
      brokerId: '201',
      decision: 'REJECT',
      nextStatus: 'REJECTED',
      reason: 'Risk policy',
    });
  });

  it('blocks validation from final states', async () => {
    repository.findOrderByReference.mockResolvedValue(
      validatableOrder('EXECUTED'),
    );

    await expect(
      service.validateOrder({
        orderReference: 'order-reference',
        brokerId: '201',
        decision: 'APPROVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid input', async () => {
    await expect(
      service.validateOrder({
        orderReference: '',
        brokerId: '201',
        decision: 'APPROVE',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function validatableOrder(
  status: BrokerValidatableOrder['status'],
): BrokerValidatableOrder {
  return {
    id: '1',
    orderReference: 'order-reference',
    traderId: '101',
    side: 'BUY',
    orderType: 'MARKET',
    status,
  };
}
