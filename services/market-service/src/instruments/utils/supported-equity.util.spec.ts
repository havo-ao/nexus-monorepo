import { isSupportedEquity } from './supported-equity.util';

describe('isSupportedEquity', () => {
  it('accepts common stock rows from the provider listing', () => {
    expect(
      isSupportedEquity({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'Stock',
      }),
    ).toBe(true);
  });

  it('accepts enriched Alpha Vantage common stock metadata', () => {
    expect(
      isSupportedEquity({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'Common Stock',
      }),
    ).toBe(true);
  });

  it('rejects unsupported security asset types', () => {
    expect(
      isSupportedEquity({
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        assetType: 'ETF',
      }),
    ).toBe(false);
  });

  it('rejects warrant and unit listings even when the provider marks them as stock', () => {
    expect(
      isSupportedEquity({
        symbol: 'AACIW',
        name: 'Armada Acquisition Corp I - Warrants (13/08/2026)',
        assetType: 'Stock',
      }),
    ).toBe(false);
    expect(
      isSupportedEquity({
        symbol: 'AACIU',
        name: 'Armada Acquisition Corp I - Units',
        assetType: 'Stock',
      }),
    ).toBe(false);
  });

  it('rejects provider symbols that are not stock ticker friendly', () => {
    expect(
      isSupportedEquity({
        symbol: 'GLTR:BAT',
        name: 'ETFS Physical Precious Metal Basket Shares',
        assetType: 'Stock',
      }),
    ).toBe(false);
    expect(
      isSupportedEquity({
        symbol: '-P-HIZ',
        name: 'Presurance Holdings Inc',
        assetType: 'Stock',
      }),
    ).toBe(false);
  });

  it('rejects leveraged or inverse exchange traded products', () => {
    expect(
      isSupportedEquity({
        symbol: 'AAPD',
        name: 'DIREXION DAILY AAPL BEAR 1X SHARES',
        assetType: 'Stock',
      }),
    ).toBe(false);
    expect(
      isSupportedEquity({
        symbol: 'AAPU',
        name: 'DIREXION DAILY AAPL BULL 2X SHARES',
        assetType: 'Stock',
      }),
    ).toBe(false);
  });
});
