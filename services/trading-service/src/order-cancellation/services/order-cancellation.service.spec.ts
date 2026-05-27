import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderCancellation } from '../entities/order-cancellation.entity';
import {
  ORDER_CANCELLATION_REPOSITORY,
  type OrderCancellationRepository,
} from '../repositories/order-cancellation.repository';
import { OrderCancellationService } from './order-cancellation.service';

describe('OrderCancellationService', () => {
  let service: OrderCancellationService;
  let repository: jest.Mocked<OrderCancellationRepository>;

  beforeEach(async () => {
    repository = {
      cancelOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCancellationService,
        {
          provide: ORDER_CANCELLATION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(OrderCancellationService);
  });

  it('cancels an open order with a default reason', async () => {
    const cancellation = new OrderCancellation(
      '1',
      'order-reference',
      'PENDING_EXECUTION',
      'CANCELLED',
      250,
      'Trader requested cancellation before execution',
    );
    repository.cancelOrder.mockResolvedValue({
      cancelled: true,
      cancellation,
    });

    await expect(
      service.cancelOrder({
        orderReference: ' order-reference ',
        actorId: ' 101 ',
      }),
    ).resolves.toBe(cancellation);

    expect(repository.cancelOrder.mock.calls[0][0]).toEqual({
      orderReference: 'order-reference',
      actorId: '101',
      reason: 'Trader requested cancellation before execution',
    });
  });

  it('throws not found when the order does not exist', async () => {
    repository.cancelOrder.mockResolvedValue({
      cancelled: false,
      reason: 'Order was not found',
    });

    await expect(
      service.cancelOrder({
        orderReference: 'missing-order',
        actorId: '101',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws conflict when the order is already final', async () => {
    repository.cancelOrder.mockResolvedValue({
      cancelled: false,
      reason: 'Order cannot be cancelled from status EXECUTED',
    });

    await expect(
      service.cancelOrder({
        orderReference: 'order-reference',
        actorId: '101',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('requires order reference and actor id', async () => {
    await expect(
      service.cancelOrder({
        orderReference: '',
        actorId: '101',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.cancelOrder({
        orderReference: 'order-reference',
        actorId: '',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.cancelOrder.mock.calls).toHaveLength(0);
  });
});
