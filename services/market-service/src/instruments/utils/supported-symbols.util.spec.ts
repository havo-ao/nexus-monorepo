import {
  DEFAULT_ALPHA_VANTAGE_SUPPORTED_SYMBOLS,
  isSupportedSymbol,
  resolveSupportedSymbols,
} from './supported-symbols.util';

describe('supported symbols', () => {
  it('uses the backend curated Alpha Vantage symbols', () => {
    expect(resolveSupportedSymbols()).toEqual(
      new Set(DEFAULT_ALPHA_VANTAGE_SUPPORTED_SYMBOLS),
    );
  });

  it('normalizes symbols before checking membership', () => {
    expect(isSupportedSymbol(' msft ')).toBe(true);
    expect(isSupportedSymbol('ABXL')).toBe(false);
  });
});
