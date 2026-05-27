import { Test, TestingModule } from '@nestjs/testing';
import { OrderSettlement } from '../entities/order-settlement.entity';
import { OrderSettlementService } from '../services/order-settlement.service';
import { OrderSettlementController } from './order-settlement.controller';

describe('OrderSettlementController', () => {
  let controller: OrderSettlementController;
  let service: jest.Mocked<Pick<OrderSettlementService, 'syncOrderSettlement'>>;

  beforeEach(async () => {
    service = {
      syncOrderSettlement: jest
        .fn()
        .mockResolvedValue(
          new OrderSettlement(
            '1',
            'order-reference',
            '101',
            'BUY',
            'EXECUTED',
            'AAPL',
            3,
            3,
            250,
            750,
            11.25,
            761.25,
            'USD',
            'ALPACA',
            'alpaca-order-id',
            'filled',
            true,
            true,
            true,
            '2026-05-27T12:00:00.000Z',
          ),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderSettlementController],
      providers: [
        {
          provide: OrderSettlementService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(OrderSettlementController);
  });

  it('delegates settlement synchronization to the service', async () => {
    await expect(
      controller.syncOrderSettlement('order-reference', 'Bearer trader-token', {
        actorId: 'broker-reviewer',
        notificationRecipient: {
          email: 'trader@nexus.local',
          name: 'Andy Trader',
        },
      }),
    ).resolves.toMatchObject({
      orderReference: 'order-reference',
      status: 'EXECUTED',
      portfolioUpdated: true,
      notificationDelivered: true,
    });

    expect(service.syncOrderSettlement).toHaveBeenCalledWith({
      orderReference: 'order-reference',
      authorizationHeader: 'Bearer trader-token',
      actorId: 'broker-reviewer',
      notificationRecipient: {
        email: 'trader@nexus.local',
        name: 'Andy Trader',
      },
    });
  });
});
