import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatusSnapshot } from '../entities/order-status-snapshot.entity';
import { OrderStatusService } from '../services/order-status.service';
import { OrderStatusController } from './order-status.controller';

describe('OrderStatusController', () => {
  let controller: OrderStatusController;
  let service: jest.Mocked<OrderStatusService>;

  beforeEach(async () => {
    service = {
      getCurrentStatus: jest.fn(),
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
});
