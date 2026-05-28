import { InMemoryCommissionCalculationRepository } from './in-memory-commission-calculation.repository';

describe('InMemoryCommissionCalculationRepository', () => {
  it('stores commission calculations in memory', async () => {
    const repository = new InMemoryCommissionCalculationRepository();

    const calculation = await repository.saveCalculation({
      traderId: '101',
      side: 'BUY',
      orderType: 'MARKET',
      grossAmount: 750,
      rateBps: 35,
      commissionAmount: 2.63,
      netAmount: 752.63,
      currency: 'USD',
      calculatedAt: '2026-05-26T14:30:00.000Z',
    });

    expect(calculation).toMatchObject({
      traderId: '101',
      commissionAmount: 2.63,
      netAmount: 752.63,
    });
    expect(repository.calculations).toHaveLength(1);
  });
});
