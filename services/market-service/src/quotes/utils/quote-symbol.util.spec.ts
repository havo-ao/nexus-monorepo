import { BadRequestException } from '@nestjs/common';
import { normalizeQuoteSymbol } from './quote-symbol.util';

describe('normalizeQuoteSymbol', () => {
  it('trims and uppercases a quote symbol', () => {
    expect(normalizeQuoteSymbol(' aapl ')).toBe('AAPL');
  });

  it('rejects empty symbols', () => {
    expect(() => normalizeQuoteSymbol(' ')).toThrow(BadRequestException);
  });
});
