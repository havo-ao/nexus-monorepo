import { HttpComplianceRestrictionsClient } from './http-compliance-restrictions.client';

describe('HttpComplianceRestrictionsClient', () => {
  const originalFetch = global.fetch;
  const originalComplianceUrl = process.env.COMPLIANCE_SERVICE_URL;
  const originalTimeout = process.env.COMPLIANCE_SERVICE_TIMEOUT_MS;

  beforeEach(() => {
    process.env.COMPLIANCE_SERVICE_URL = 'http://compliance-service:8885/';
    process.env.COMPLIANCE_SERVICE_TIMEOUT_MS = '3000';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.COMPLIANCE_SERVICE_URL = originalComplianceUrl;
    process.env.COMPLIANCE_SERVICE_TIMEOUT_MS = originalTimeout;
    jest.useRealTimers();
  });

  it('maps an allowed compliance response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            traderId: '101',
            operation: 'CREATE_MARKET_BUY_ORDER',
            allowed: true,
            status: 'CLEAR',
          }),
        ),
    });

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_MARKET_BUY_ORDER',
      });

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('CLEAR');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://compliance-service:8885/api/v1/restrictions/validate-operation',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          traderId: '101',
          operation: 'CREATE_MARKET_BUY_ORDER',
          sourceService: 'trading-service',
        }),
      }),
    );
  });

  it('maps a restricted compliance response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            traderId: '101',
            operation: 'CREATE_LIMIT_BUY_ORDER',
            allowed: false,
            status: 'RESTRICTED',
            reason: 'Trader is restricted',
          }),
        ),
    });

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_LIMIT_BUY_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Trader is restricted');
  });

  it('fails closed when compliance service is not configured', async () => {
    delete process.env.COMPLIANCE_SERVICE_URL;

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_MARKET_SELL_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.reason).toBe('Compliance service URL is not configured');
  });

  it('fails closed when compliance service returns an error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(JSON.stringify({ reason: 'Maintenance' })),
    });

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_MARKET_SELL_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Maintenance');
  });

  it('uses a generic reason for empty error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    });

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_MARKET_BUY_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe(
      'Compliance service rejected validation with 500',
    );
  });

  it('uses plain text error responses when they are not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      text: () => Promise.resolve('Bad gateway'),
    });

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_MARKET_BUY_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Bad gateway');
  });

  it('fails closed on timeout', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    );

    const result =
      await new HttpComplianceRestrictionsClient().validateOperation({
        traderId: '101',
        operation: 'CREATE_TAKE_PROFIT_ORDER',
      });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Compliance service request timed out');
  });
});
