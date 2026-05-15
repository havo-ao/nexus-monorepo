import { InMemoryInstrumentsRepository } from './in-memory-instruments.repository';

describe('InMemoryInstrumentsRepository', () => {
  it('returns configured active instruments sorted by symbol', () => {
    const repository = new InMemoryInstrumentsRepository();

    const instruments = repository.findAvailable();

    expect(
      instruments.map((instrument) => instrument.toSnapshot().symbol),
    ).toEqual(['AAPL', 'HSBC', 'JPM', 'KO', 'MSFT', 'TSLA']);
    expect(instruments.every((instrument) => instrument.isAvailable())).toBe(
      true,
    );
  });
});
