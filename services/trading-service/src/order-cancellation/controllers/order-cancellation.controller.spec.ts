import { Test, TestingModule } from '@nestjs/testing';
import { OrderCancellation } from '../entities/order-cancellation.entity';
import { OrderCancellationService } from '../services/order-cancellation.service';
import { OrderCancellationController } from './order-cancellation.controller';

describe('OrderCancellationController', () => {
  let controller: OrderCancellationController;
  let service: jest.Mocked<OrderCancellationService>;

  beforeEach(async () => {
    service = {
      cancelOrder: jest.fn(),
    } as unknown as jest.Mocked<OrderCancellationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderCancellationController],
      providers: [
        {
          provide: OrderCancellationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(OrderCancellationController);
  });

  it('delegates cancellation to the service', async () => {
    const cancellation = new OrderCancellation(
      '1',
      'order-reference',
      'PENDING_EXECUTION',
      'CANCELLED',
      250,
      'Trader requested cancellation before execution',
    );
    service.cancelOrder.mockResolvedValue(cancellation);

    await expect(
      controller.cancelOrder('order-reference', {
        actorId: '101',
      }),
    ).resolves.toBe(cancellation);

    expect(service.cancelOrder.mock.calls[0][0]).toEqual({
      orderReference: 'order-reference',
      actorId: '101',
      reason: undefined,
    });
  });
});
