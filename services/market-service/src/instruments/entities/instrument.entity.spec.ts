import { Instrument } from './instrument.entity';

describe('Instrument', () => {
  it('normalizes valid instrument snapshots', () => {
    const instrument = Instrument.restore({
      symbol: ' aapl ',
      name: ' Apple Inc. ',
      marketCode: ' nasdaq ',
      currency: ' usd ',
      sector: ' Technology ',
      status: 'ACTIVE',
    });

    expect(instrument.toSnapshot()).toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketCode: 'NASDAQ',
      currency: 'USD',
      sector: 'Technology',
      status: 'ACTIVE',
    });
    expect(instrument.isAvailable()).toBe(true);
  });

  it('marks inactive instruments as unavailable', () => {
    const instrument = Instrument.restore({
      symbol: 'BVC',
      name: 'Inactive Instrument',
      marketCode: 'NYSE',
      currency: 'USD',
      sector: 'Other',
      status: 'INACTIVE',
    });

    expect(instrument.isAvailable()).toBe(false);
  });

  it('rejects incomplete instrument configuration', () => {
    expect(() =>
      Instrument.restore({
        symbol: '',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    ).toThrow(TypeError);
  });

  it('rejects invalid currency codes', () => {
    expect(() =>
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'US',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    ).toThrow(TypeError);
  });
});
