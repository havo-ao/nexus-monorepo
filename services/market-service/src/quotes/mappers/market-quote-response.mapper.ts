import { MarketQuoteResponseDto } from '../dto/market-quote-response.dto';
import { MarketQuote } from '../entities/market-quote.entity';

export function toMarketQuoteResponse(
  quote: MarketQuote,
): MarketQuoteResponseDto {
  const snapshot = quote.toSnapshot();

  return {
    symbol: snapshot.symbol,
    price: snapshot.price,
    bid: snapshot.bid,
    ask: snapshot.ask,
    spread: snapshot.spread,
    currency: snapshot.currency,
    provider: snapshot.provider,
    asOf: snapshot.asOf.toISOString(),
  };
}
