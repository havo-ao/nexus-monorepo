import { InMemoryOrderRepository } from './in-memory-order.repository';

describe('InMemoryOrderRepository', () => {
  it('creates a pending execution market buy order and reserves funds', async () => {
    const repository = new InMemoryOrderRepository();

    const result = await repository.createMarketBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      status: 'PENDING_EXECUTION',
      symbol: 'AAPL',
      grossAmount: 750,
      reservedAmount: 750,
    });
    expect(repository.orders).toHaveLength(1);
  });

  it('rejects creation when available funds are insufficient', async () => {
    const repository = new InMemoryOrderRepository();

    const result = await repository.createMarketBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 5,
      estimatedUnitPrice: 250,
      grossAmount: 1250,
      currency: 'USD',
    });

    expect(result).toEqual({
      approved: false,
      reason: 'Insufficient available funds',
      availableAmount: 1000,
      requiredAmount: 1250,
    });
    expect(repository.orders).toHaveLength(0);
  });

  it('creates a pending condition limit buy order and reserves funds', async () => {
    const repository = new InMemoryOrderRepository();

    const result = await repository.createLimitBuyOrder({
      traderId: '101',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 2,
      limitPrice: 240,
      grossAmount: 480,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      traderId: '101',
      side: 'BUY',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      estimatedUnitPrice: 240,
      limitPrice: 240,
      grossAmount: 480,
      reservedAmount: 480,
    });
    expect(repository.orders).toHaveLength(1);
  });

  it('creates a pending execution market sell order without reserving funds', async () => {
    const repository = new InMemoryOrderRepository();

    const result = await repository.createMarketSellOrder({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      estimatedUnitPrice: 250,
      grossAmount: 750,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'MARKET',
      status: 'PENDING_EXECUTION',
      symbol: 'AAPL',
      grossAmount: 750,
      reservedAmount: 0,
    });
    expect(repository.orders).toHaveLength(1);
  });

  it('creates a pending condition limit sell order without reserving funds', async () => {
    const repository = new InMemoryOrderRepository();

    const result = await repository.createLimitSellOrder({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      exchangeId: '1',
      quantity: 3,
      limitPrice: 260,
      grossAmount: 780,
      currency: 'USD',
    });

    expect(result.approved).toBe(true);
    expect(result.order).toMatchObject({
      traderId: '101',
      stockId: '1',
      side: 'SELL',
      orderType: 'LIMIT',
      status: 'PENDING_CONDITION',
      symbol: 'AAPL',
      estimatedUnitPrice: 260,
      limitPrice: 260,
      grossAmount: 780,
      reservedAmount: 0,
    });
    expect(repository.orders).toHaveLength(1);
  });
});
