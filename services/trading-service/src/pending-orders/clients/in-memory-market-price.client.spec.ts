import { InMemoryMarketPriceClient } from './in-memory-market-price.client';

describe('InMemoryMarketPriceClient', () => {
  it('returns configured prices and rejects unknown symbols', async () => {
    const client = new InMemoryMarketPriceClient();
    client.setPrice('msft', 310);

    await expect(client.getLatestPrice('MSFT')).resolves.toMatchObject({
      symbol: 'MSFT',
      price: 310,
    });
    await expect(client.getLatestPrice('UNKNOWN')).rejects.toThrow(
      'Market quote price is not available',
    );
  });
});
