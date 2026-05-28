import { InMemoryTraderHoldingsRepository } from './in-memory-trader-holdings.repository';

describe('InMemoryTraderHoldingsRepository', () => {
  it('approves when the trader has enough holdings', async () => {
    const repository = new InMemoryTraderHoldingsRepository();

    const result = await repository.validateSellHoldings({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 3,
    });

    expect(result).toEqual({
      approved: true,
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: 3,
      availableQuantity: 10,
    });
    expect(repository.validationEvents).toHaveLength(1);
  });

  it('rejects when the trader has insufficient holdings', async () => {
    const repository = new InMemoryTraderHoldingsRepository();

    const result = await repository.validateSellHoldings({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 12,
    });

    expect(result).toEqual({
      approved: false,
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: 12,
      availableQuantity: 10,
      reason: 'Insufficient available holdings',
    });
    expect(repository.validationEvents).toHaveLength(1);
  });
});
