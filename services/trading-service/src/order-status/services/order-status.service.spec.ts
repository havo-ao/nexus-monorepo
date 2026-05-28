import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatusHistoryEntry } from '../entities/order-status-history-entry.entity';
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
      findStatusHistoryByReference: jest.fn(),
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

  it('returns status history for an existing order', async () => {
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
    const history = [
      new OrderStatusHistoryEntry(
        '1',
        '1',
        'order-reference',
        'PENDING_EXECUTION',
        'TRADER',
        '101',
        'Market buy order created after funds reservation',
        '2026-05-26T14:30:00.000Z',
      ),
    ];
    repository.findCurrentStatusByReference.mockResolvedValue(snapshot);
    repository.findStatusHistoryByReference.mockResolvedValue(history);

    await expect(service.getStatusHistory(' order-reference ')).resolves.toBe(
      history,
    );

    expect(repository.findStatusHistoryByReference.mock.calls[0][0]).toBe(
      'order-reference',
    );
  });

  it('throws not found when history is requested for an unknown order', async () => {
    repository.findCurrentStatusByReference.mockResolvedValue(null);

    await expect(service.getStatusHistory('missing-order')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findStatusHistoryByReference.mock.calls).toHaveLength(0);
  });
});
