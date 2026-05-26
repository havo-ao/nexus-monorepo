import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';
import {
  ORDER_STATUS_REPOSITORY,
  type OrderStatusRepository,
} from '../repositories/order-status.repository';
import { OrderStatusService } from './order-status.service';

describe('OrderStatusService', () => {
  let service: OrderStatusService;
  let repository: jest.Mocked<OrderStatusRepository>;

  beforeEach(async () => {
    repository = {
      findCurrentStatusByReference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStatusService,
        {
          provide: ORDER_STATUS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(OrderStatusService);
  });

  it('returns the current order status', async () => {
    const snapshot = new OrderStatusSnapshot(
      '1',
      'order-reference',
      '101',
      'BUY',
      'MARKET',
      'PENDING_EXECUTION',
      'AAPL',
      '1',
      1,
      250,
      250,
      250,
      'USD',
      '2026-05-26T14:30:00.000Z',
      '2026-05-26T14:30:00.000Z',
    );
    repository.findCurrentStatusByReference.mockResolvedValue(snapshot);

    await expect(service.getCurrentStatus(' order-reference ')).resolves.toBe(
      snapshot,
    );

    expect(repository.findCurrentStatusByReference.mock.calls[0][0]).toBe(
      'order-reference',
    );
  });

  it('throws not found when the order does not exist', async () => {
    repository.findCurrentStatusByReference.mockResolvedValue(null);

    await expect(service.getCurrentStatus('missing-order')).rejects.toThrow(
      NotFoundException,
    );
  });
});
