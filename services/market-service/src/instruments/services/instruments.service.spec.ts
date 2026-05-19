import { Test, TestingModule } from '@nestjs/testing';
import { Instrument } from '../entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentsService } from './instruments.service';

describe('InstrumentsService', () => {
  const repository: jest.Mocked<InstrumentsRepository> = {
    saveInstruments: jest.fn(),
    findAvailable: jest.fn(),
    findBySymbol: jest.fn(),
  };

  let service: InstrumentsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        {
          provide: INSTRUMENTS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<InstrumentsService>(InstrumentsService);
  });

  it('returns available instruments as API response DTOs', async () => {
    repository.findAvailable.mockResolvedValue([
      Instrument.restore({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      }),
    ]);

    await expect(service.getAvailableInstruments()).resolves.toEqual([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        marketCode: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
        status: 'ACTIVE',
      },
    ]);
  });
});
