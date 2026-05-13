import { InMemoryTraderFundsRepository } from './in-memory-trader-funds.repository';

describe('InMemoryTraderFundsRepository', () => {
  let repository: InMemoryTraderFundsRepository;

  beforeEach(() => {
    repository = new InMemoryTraderFundsRepository();
  });

  it('reserves funds and records an event when balance is sufficient', async () => {
    const result = await repository.reserveBuyFunds('trader-1', 750);

    expect(result).toEqual({
      approved: true,
      traderId: 'trader-1',
      availableAmount: 100000,
      requiredAmount: 750,
      reservedAmount: 750,
    });
    expect(repository.validationEvents).toEqual([result]);

    const secondResult = await repository.reserveBuyFunds('trader-1', 250);
    expect(secondResult).toMatchObject({
      approved: true,
      availableAmount: 99250,
      reservedAmount: 1000,
    });
  });

  it('rejects and records an event when balance is insufficient', async () => {
    const result = await repository.reserveBuyFunds('unknown-trader', 10);

    expect(result).toEqual({
      approved: false,
      traderId: 'unknown-trader',
      availableAmount: 0,
      requiredAmount: 10,
      reservedAmount: 0,
      reason: 'Insufficient available funds',
    });
    expect(repository.validationEvents).toEqual([result]);
  });
});
