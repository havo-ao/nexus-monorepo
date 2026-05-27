import { DataSource, EntityManager, Repository } from 'typeorm';
import { MarketExchange } from '../../market/entities/market-exchange.entity';
import { MarketValidationEvent } from '../entities/market-validation-event.entity';
import { HttpMarketServiceStatusRepository } from './http-market-service-status.repository';

describe('HttpMarketServiceStatusRepository', () => {
  let repository: HttpMarketServiceStatusRepository;
  let exchangeRepository: jest.Mocked<
    Pick<Repository<MarketExchange>, 'findOne'>
  >;
  let eventRepository: jest.Mocked<
    Pick<Repository<MarketValidationEvent>, 'save'>
  >;
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;
  const originalMarketServiceUrl = process.env.MARKET_SERVICE_URL;
  const originalMarketServiceTimeout = process.env.MARKET_SERVICE_TIMEOUT_MS;

  beforeEach(() => {
    process.env.MARKET_SERVICE_URL = 'http://market-service:8884/';
    process.env.MARKET_SERVICE_TIMEOUT_MS = '3000';
    const exchange = new MarketExchange();
    exchange.id = '1';
    exchange.name = 'NYSE';
    exchange.country = 'United States';
    exchange.timezone = 'America/New_York';
    exchange.openTime = '09:30:00';
    exchange.closeTime = '16:00:00';

    exchangeRepository = {
      findOne: jest.fn().mockResolvedValue(exchange),
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
    } as unknown as DataSource;

    fetchMock = jest.fn();
    global.fetch = fetchMock;
    repository = new HttpMarketServiceStatusRepository(dataSource);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.MARKET_SERVICE_URL = originalMarketServiceUrl;
    process.env.MARKET_SERVICE_TIMEOUT_MS = originalMarketServiceTimeout;
  });

  it('uses market-service status and stores local validation evidence', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          marketCode: 'NYSE',
          status: 'OPEN',
          canProcessOrder: true,
          evaluatedAt: '2026-05-12T14:30:00.000Z',
          timezone: 'America/New_York',
          reason: 'Market is open for trading',
        }),
        { status: 200 },
      ),
    );

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('1', evaluatedAt);

    expect(result).toMatchObject({
      canOperate: true,
      exchangeId: '1',
      marketStatus: 'OPEN',
      evaluatedAt,
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
      reason: 'Market is open for trading',
    });
    const firstFetchCall = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstFetchCall[0]).toBe(
      'http://market-service:8884/api/v1/market-hours/NYSE/status?at=2026-05-12T14%3A30%3A00.000Z',
    );
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      exchangeId: '1',
      marketStatus: 'OPEN',
      canOperate: true,
      timezone: 'America/New_York',
      openTime: '09:30:00',
      closeTime: '16:00:00',
      reason: 'Market is open for trading',
    });
  });

  it('restricts trading and stores evidence when market-service fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reason: 'Market configuration missing' }), {
        status: 404,
      }),
    );

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('1', evaluatedAt);

    expect(result).toMatchObject({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      reason: 'Market configuration missing',
    });
    expect(eventRepository.save.mock.calls[0][0]).toMatchObject({
      exchangeId: '1',
      marketStatus: 'RESTRICTED',
      canOperate: false,
      reason: 'Market configuration missing',
    });
  });

  it('restricts trading when market-service URL is not configured', async () => {
    delete process.env.MARKET_SERVICE_URL;

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('1', evaluatedAt);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'RESTRICTED',
      reason: 'Market service URL is not configured',
    });
  });

  it('restricts trading when market-service is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('1', evaluatedAt);

    expect(result).toMatchObject({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'RESTRICTED',
      reason: 'Market service is unavailable',
    });
  });

  it('restricts trading when market-service request times out', async () => {
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    fetchMock.mockRejectedValue(timeoutError);

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    const result = await repository.validateMarketStatus('1', evaluatedAt);

    expect(result).toMatchObject({
      canOperate: false,
      exchangeId: '1',
      marketStatus: 'RESTRICTED',
      reason: 'Market service request timed out',
    });
  });

  it('uses controlled fallbacks for empty and unexpected market-service responses', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'HALTED',
            canProcessOrder: true,
          }),
          { status: 200 },
        ),
      );

    const evaluatedAt = new Date('2026-05-12T14:30:00.000Z');
    await expect(
      repository.validateMarketStatus('1', evaluatedAt),
    ).resolves.toMatchObject({
      canOperate: false,
      marketStatus: 'RESTRICTED',
      reason: 'Market service rejected validation with 503',
    });
    await expect(
      repository.validateMarketStatus('1', evaluatedAt),
    ).resolves.toMatchObject({
      canOperate: false,
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      timezone: 'America/New_York',
    });
  });
});
