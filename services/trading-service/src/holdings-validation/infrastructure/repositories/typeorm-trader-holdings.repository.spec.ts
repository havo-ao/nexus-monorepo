import { DataSource, EntityManager, Repository } from 'typeorm';
import { PortfolioPosition } from '../../../portfolio/domain/entities/portfolio-position.entity';
import { HoldingsValidationEvent } from '../../domain/entities/holdings-validation-event.entity';
import { TypeOrmTraderHoldingsRepository } from './typeorm-trader-holdings.repository';

describe('TypeOrmTraderHoldingsRepository', () => {
  let dataSource: jest.Mocked<DataSource>;
  let positionRepository: jest.Mocked<Repository<PortfolioPosition>>;
  let eventRepository: jest.Mocked<Repository<HoldingsValidationEvent>>;

  beforeEach(() => {
    positionRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<PortfolioPosition>>;
    eventRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<HoldingsValidationEvent>>;

    const entityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === PortfolioPosition) {
          return positionRepository;
        }
        return eventRepository;
      }),
    } as unknown as EntityManager;

    dataSource = {
      transaction: jest.fn(<T>(callback: (manager: EntityManager) => T) =>
        callback(entityManager),
      ),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('approves and records an event when holdings are sufficient', async () => {
    const repository = new TypeOrmTraderHoldingsRepository(dataSource);
    positionRepository.findOne.mockResolvedValue(positionEntity(10));

    const result = await repository.validateSellHoldings({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 3,
    });

    expect(result).toEqual({
      approved: true,
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: 3,
      availableQuantity: 10,
    });
    expect(positionRepository.findOne.mock.calls[0][0]).toMatchObject({
      where: { traderId: '101', stockId: '1' },
      lock: { mode: 'pessimistic_read' },
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      requestedQuantity: '3.000000',
      availableQuantity: '10.000000',
      approved: true,
    });
  });

  it('rejects and records an event when holdings are insufficient', async () => {
    const repository = new TypeOrmTraderHoldingsRepository(dataSource);
    positionRepository.findOne.mockResolvedValue(positionEntity(2));

    const result = await repository.validateSellHoldings({
      traderId: '101',
      stockId: '1',
      symbol: 'AAPL',
      quantity: 3,
    });

    expect(result).toMatchObject({
      approved: false,
      requestedQuantity: 3,
      availableQuantity: 2,
      reason: 'Insufficient available holdings',
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      approved: false,
      reason: 'Insufficient available holdings',
    });
  });

  it('rejects when the position does not exist', async () => {
    const repository = new TypeOrmTraderHoldingsRepository(dataSource);
    positionRepository.findOne.mockResolvedValue(null);

    const result = await repository.validateSellHoldings({
      traderId: '404',
      stockId: '1',
      quantity: 1,
    });

    expect(result).toMatchObject({
      approved: false,
      traderId: '404',
      stockId: '1',
      requestedQuantity: 1,
      availableQuantity: 0,
      reason: 'Insufficient available holdings',
    });
  });

  function positionEntity(quantity: number): PortfolioPosition {
    const position = new PortfolioPosition();
    position.id = '1';
    position.traderId = '101';
    position.stockId = '1';
    position.quantity = quantity;
    position.avgBuyPrice = '200.00';
    position.totalInvested = '2000.00';
    position.lastUpdated = new Date('2026-05-26T14:00:00.000Z');
    return position;
  }
});
