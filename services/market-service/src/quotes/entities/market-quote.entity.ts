export interface MarketQuoteSnapshot {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  currency: string;
  provider: string;
  asOf: Date;
}

export interface ProviderQuoteSnapshot {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  currency: string;
  provider: string;
  asOf: Date;
}

export class MarketQuote {
  private constructor(private readonly snapshot: MarketQuoteSnapshot) {}

  static fromProvider(snapshot: ProviderQuoteSnapshot): MarketQuote {
    const spread = Number((snapshot.ask - snapshot.bid).toFixed(6));

    return MarketQuote.restore({
      ...snapshot,
      symbol: snapshot.symbol.trim().toUpperCase(),
      currency: snapshot.currency.trim().toUpperCase(),
      provider: snapshot.provider.trim(),
      spread,
    });
  }

  static restore(snapshot: MarketQuoteSnapshot): MarketQuote {
    if (typeof snapshot.symbol !== 'string' || !snapshot.symbol.trim()) {
      throw new TypeError('Quote symbol is required');
    }

    if (typeof snapshot.currency !== 'string' || !snapshot.currency.trim()) {
      throw new TypeError('Quote currency is required');
    }

    if (typeof snapshot.provider !== 'string' || !snapshot.provider.trim()) {
      throw new TypeError('Quote provider is required');
    }

    this.assertPositiveAmount(snapshot.price, 'price');
    this.assertPositiveAmount(snapshot.bid, 'bid');
    this.assertPositiveAmount(snapshot.ask, 'ask');

    if (snapshot.bid > snapshot.ask) {
      throw new RangeError('Quote bid must be lower than or equal to ask');
    }

    if (!Number.isFinite(snapshot.spread) || snapshot.spread < 0) {
      throw new RangeError('Quote spread must be a non-negative number');
    }

    if (
      !(snapshot.asOf instanceof Date) ||
      Number.isNaN(snapshot.asOf.getTime())
    ) {
      throw new TypeError('Quote timestamp must be valid');
    }

    return new MarketQuote({
      ...snapshot,
      symbol: snapshot.symbol.trim().toUpperCase(),
      currency: snapshot.currency.trim().toUpperCase(),
      provider: snapshot.provider.trim(),
      asOf: new Date(snapshot.asOf),
    });
  }

  toSnapshot(): MarketQuoteSnapshot {
    return {
      ...this.snapshot,
      asOf: new Date(this.snapshot.asOf),
    };
  }

  private static assertPositiveAmount(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`Quote ${name} must be a positive number`);
    }
  }
}
