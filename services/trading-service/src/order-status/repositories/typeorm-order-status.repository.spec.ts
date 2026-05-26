import { DataSource, Repository } from 'typeorm';
import { TradingOrderEntity } from '../../orders/entities/trading-order.entity';
import { TypeOrmOrderStatusRepository } from './typeorm-order-status.repository';

describe('TypeOrmOrderStatusRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let orderRepository: jest.Mocked<Repository<TradingOrderEntity>>;

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<TradingOrderEntity>>;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(orderRepository),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('maps a trading order entity into a status snapshot', async () => {
    const repository = new TypeOrmOrderStatusRepository(dataSource);
    const entity = new TradingOrderEntity();
    entity.id = '1';
    entity.orderReference = 'order-reference';
    entity.traderId = '101';
    entity.side = 'SELL';
    entity.orderType = 'LIMIT';
    entity.status = 'PENDING_CONDITION';
    entity.symbol = 'AAPL';
    entity.exchangeId = '1';
    entity.stockId = '1';
    entity.quantity = '3.000000';
    entity.estimatedUnitPrice = '260.00';
    entity.limitPrice = '260.00';
    entity.grossAmount = '780.00';
    entity.reservedAmount = '0.00';
    entity.currency = 'USD';
    entity.createdAt = new Date('2026-05-26T14:30:00.000Z');
    entity.updatedAt = new Date('2026-05-26T14:31:00.000Z');
    orderRepository.findOne.mockResolvedValue(entity);

    await expect(
      repository.findCurrentStatusByReference('order-reference'),
    ).resolves.toMatchObject({
      orderId: '1',
      orderReference: 'order-reference',
      traderId: '101',
      side: 'SELL',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      quantity: 3,
      estimatedUnitPrice: 260,
      limitPrice: 260,
      grossAmount: 780,
      reservedAmount: 0,
    });
    expect(orderRepository.findOne.mock.calls[0][0]).toEqual({
      where: { orderReference: 'order-reference' },
    });
  });

  it('returns null when the order is not found', async () => {
    const repository = new TypeOrmOrderStatusRepository(dataSource);
    orderRepository.findOne.mockResolvedValue(null);

    await expect(
      repository.findCurrentStatusByReference('missing-order'),
    ).resolves.toBeNull();
  });
});
