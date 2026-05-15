import { Market } from './market.entity';

describe('Market', () => {
  it('normalizes valid market snapshots', () => {
    const market = Market.restore({
      code: ' nyse ',
      name: ' New York Stock Exchange ',
      country: ' United States ',
      currency: ' usd ',
      timezone: ' America/New_York ',
      status: 'ACTIVE',
      representativeSymbols: [' jpm ', 'aapl'],
    });

    expect(market.toSnapshot()).toEqual({
      code: 'NYSE',
      name: 'New York Stock Exchange',
      country: 'United States',
      currency: 'USD',
      timezone: 'America/New_York',
      status: 'ACTIVE',
      representativeSymbols: ['AAPL', 'JPM'],
    });
    expect(market.isAvailable()).toBe(true);
  });

  it('marks inactive markets as unavailable', () => {
    const market = Market.restore({
      code: 'BVC',
      name: 'Bolsa de Valores de Colombia',
      country: 'Colombia',
      currency: 'COP',
      timezone: 'America/Bogota',
      status: 'INACTIVE',
      representativeSymbols: ['ECOPETROL'],
    });

    expect(market.isAvailable()).toBe(false);
  });

  it('rejects incomplete market configuration', () => {
    expect(() =>
      Market.restore({
        code: '',
        name: 'Market',
        country: 'Country',
        currency: 'USD',
        timezone: 'UTC',
        status: 'ACTIVE',
        representativeSymbols: [],
      }),
    ).toThrow(TypeError);
  });

  it('rejects invalid representative symbols', () => {
    expect(() =>
      Market.restore({
        code: 'NYSE',
        name: 'New York Stock Exchange',
        country: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'ACTIVE',
        representativeSymbols: [' '],
      }),
    ).toThrow(TypeError);
  });
});
