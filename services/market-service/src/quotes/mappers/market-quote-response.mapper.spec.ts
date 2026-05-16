import { MarketQuote } from '../entities/market-quote.entity';
import { toMarketQuoteResponse } from './market-quote-response.mapper';

describe('toMarketQuoteResponse', () => {
  it('maps a market quote domain entity to API response shape', () => {
    const quote = MarketQuote.fromProvider({
      symbol: 'aapl',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      currency: 'usd',
      provider: 'test-provider',
      asOf: new Date('2026-05-14T14:00:00.000Z'),
    });

    expect(toMarketQuoteResponse(quote)).toEqual({
      symbol: 'AAPL',
      price: 190,
      bid: 189.95,
      ask: 190.05,
      spread: 0.1,
      currency: 'USD',
      provider: 'test-provider',
      asOf: '2026-05-14T14:00:00.000Z',
    });
  });
});
