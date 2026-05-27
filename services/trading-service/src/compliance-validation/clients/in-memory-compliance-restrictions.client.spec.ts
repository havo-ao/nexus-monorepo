import { InMemoryComplianceRestrictionsClient } from './in-memory-compliance-restrictions.client';

describe('InMemoryComplianceRestrictionsClient', () => {
  it('allows clear traders', async () => {
    const result =
      await new InMemoryComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_MARKET_BUY_ORDER',
      });

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('CLEAR');
  });

  it('blocks seeded restricted traders', async () => {
    const result =
      await new InMemoryComplianceRestrictionsClient().validateOperation({
        traderId: 'restricted-trader',
        operation: 'CREATE_MARKET_BUY_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.status).toBe('RESTRICTED');
    expect(result.reason).toBe('Trader is restricted by compliance');
  });
});
