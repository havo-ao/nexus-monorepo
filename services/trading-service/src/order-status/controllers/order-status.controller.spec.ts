import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatusHistoryEntry } from '../entities/order-status-history-entry.entity';
import { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';
import { OrderStatusService } from '../services/order-status.service';
import { OrderStatusController } from './order-status.controller';

describe('OrderStatusController', () => {
  let controller: OrderStatusController;
  let service: jest.Mocked<OrderStatusService>;

  beforeEach(async () => {
    service = {
      getCurrentStatus: jest.fn(),
      getStatusHistory: jest.fn(),
    } as unknown as jest.Mocked<OrderStatusService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderStatusController],
      providers: [
        {
          provide: OrderStatusService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(OrderStatusController);
  });

  it('delegates current status lookup to the service', async () => {
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
    service.getCurrentStatus.mockResolvedValue(snapshot);

    await expect(controller.getCurrentStatus('order-reference')).resolves.toBe(
      snapshot,
    );

    expect(service.getCurrentStatus.mock.calls[0][0]).toBe('order-reference');
  });

  it('delegates status history lookup to the service', async () => {
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
    service.getStatusHistory.mockResolvedValue(history);

    await expect(controller.getStatusHistory('order-reference')).resolves.toBe(
      history,
    );

    expect(service.getStatusHistory.mock.calls[0][0]).toBe('order-reference');
  });
});
