import { AlpacaBrokerClient } from './alpaca-broker.client';

describe('AlpacaBrokerClient', () => {
  it('returns a controlled broker acknowledgement', async () => {
    const client = new AlpacaBrokerClient();

    await expect(
      client.sendOrder({
        orderReference: 'order-reference',
        side: 'BUY',
        orderType: 'MARKET',
        symbol: 'AAPL',
        quantity: 1,
        estimatedUnitPrice: 250,
        currency: 'USD',
      }),
    ).resolves.toEqual({
      brokerName: 'ALPACA',
      externalOrderId: 'alpaca-order-reference',
      brokerStatus: 'ACCEPTED',
      requestSummary: 'BUY 1 AAPL MARKET',
      responseSummary: 'Broker accepted order alpaca-order-reference',
    });
  });
});
