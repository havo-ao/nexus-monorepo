import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MarketExchange } from '../../market/entities/market-exchange.entity';
import { MarketValidationEvent } from '../entities/market-validation-event.entity';
import { TypeOrmMarketStatusRepository } from './typeorm-market-status.repository';

describe('TypeOrmMarketStatusRepository', () => {
  let repository: TypeOrmMarketStatusRepository;
  let exchangeRepository: jest.Mocked<
    Pick<Repository<MarketExchange>, 'findOne'>
  >;
  let eventRepository: jest.Mocked<
    Pick<Repository<MarketValidationEvent>, 'save'>
  >;

  beforeEach(async () => {
    exchangeRepository = {
      findOne: jest.fn(),
    };
    eventRepository = {
      save: jest.fn(),
    };

    const entityManager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === MarketExchange ? exchangeRepository : eventRepository,
      ),
    } as unknown as EntityManager;

    const dataSource = {
      transaction: jest.fn(<T>(callback: (manager: EntityManager) => T) =>
        callback(entityManager),
      ),
    } as unknown as jest.Mocked<Pick<DataSource, 'transaction'>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmMarketStatusRepository,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmMarketStatusRepository>(
      TypeOrmMarketStatusRepository,
    );
  });

  it('stores an approval event when the market is open', async () => {
    exchangeRepository.findOne.mockResolvedValue({
      id: '1',
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
    } as MarketExchange);

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('1', evaluatedAt);

    expect(result).toMatchObject({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      timezone: 'America/New_York',
    });
    expect(exchangeRepository.findOne.mock.calls[0]).toEqual([
      { where: { id: '1' } },
    ]);
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      exchangeId: '1',
      marketStatus: 'OPEN',
      canOperate: true,
      evaluatedAt,
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
    });
  });

  it('stores a restricted event when the exchange is not configured', async () => {
    exchangeRepository.findOne.mockResolvedValue(null);

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('99', evaluatedAt);

    expect(result).toEqual({
      canOperate: false,
      exchangeId: '99',
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      reason: 'Market exchange is not available for trading',
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      exchangeId: '99',
      marketStatus: 'RESTRICTED',
      canOperate: false,
      evaluatedAt,
      reason: 'Market exchange is not available for trading',
    });
  });
});
