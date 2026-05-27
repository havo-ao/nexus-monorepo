import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { InMemoryOrderSettlementRepository } from './../src/settlements/repositories/in-memory-order-settlement.repository';
import { ORDER_SETTLEMENT_REPOSITORY } from './../src/settlements/repositories/order-settlement.repository';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'trading-service',
      });
  });

  it('/api/v1/validations/market/status (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/validations/market/status')
      .send({
        exchangeId: '1',
        evaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(200)
      .expect({
        canOperate: true,
        exchangeId: '1',
        marketStatus: 'OPEN',
        evaluatedAt: '2026-05-12T14:30:00.000Z',
        timezone: 'America/New_York',
        openTime: '09:30:00',
        closeTime: '16:00:00',
      });
  });

  it('/api/v1/orders/pending/process (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/pending/process')
      .send({
        limit: 2,
        evaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          evaluatedAt: '2026-05-12T14:30:00.000Z',
          scanned: 2,
          readyForExecution: 2,
          waiting: 0,
          failed: 0,
        });
        expect(body.evaluations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              orderReference: 'queued-market-order-reference',
              status: 'READY_FOR_EXECUTION',
              marketStatus: 'OPEN',
            }),
            expect.objectContaining({
              orderReference: 'pending-limit-order-reference',
              status: 'READY_FOR_EXECUTION',
              marketPrice: 250,
              triggerPrice: 255,
            }),
          ]),
        );
      });
  });

  it('/api/v1/validations/holdings/sell (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/validations/holdings/sell')
      .send({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        quantity: 3,
      })
      .expect(200)
      .expect({
        approved: true,
        traderId: '101',
        stockId: '1',
        requestedQuantity: 3,
        availableQuantity: 10,
        symbol: 'AAPL',
      });
  });

  it('/api/v1/commissions/calculate (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/commissions/calculate')
      .send({
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        grossAmount: 750,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          grossAmount: 750,
          rateBps: 35,
          commissionAmount: 2.63,
          netAmount: 752.63,
          currency: 'USD',
        });
        expect(body.calculatedAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/commissions/distribute (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/commissions/distribute')
      .send({
        traderId: '101',
        brokerId: '201',
        commissionAmount: 2.63,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          brokerId: '201',
          commissionAmount: 2.63,
          platformAmount: 1.84,
          brokerAmount: 0.79,
          platformShareBps: 7000,
          brokerShareBps: 3000,
          currency: 'USD',
        });
        expect(body.distributedAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/executions/broker/orders/:orderReference/send (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/executions/broker/orders/order-reference/send')
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          orderId: '1',
          orderReference: 'order-reference',
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'SENT_TO_BROKER',
          symbol: 'AAPL',
          quantity: 1,
          externalOrderId: 'alpaca-order-reference',
          brokerStatus: 'ACCEPTED',
          brokerName: 'ALPACA',
        });
        expect(body.sentAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/executions/broker/orders/:orderReference/send handles broker failure (POST)', () => {
    return request(app.getHttpServer())
      .post(
        '/api/v1/executions/broker/orders/broker-failure-order-reference/send',
      )
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          orderId: '2',
          orderReference: 'broker-failure-order-reference',
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'FAILED',
          symbol: 'FAIL',
          quantity: 1,
          externalOrderId: 'unavailable',
          brokerStatus: 'FAILED',
          brokerName: 'ALPACA',
        });
        expect(body.sentAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/:orderReference/settlement/sync (POST)', () => {
    const settlementRepository = app.get<InMemoryOrderSettlementRepository>(
      ORDER_SETTLEMENT_REPOSITORY,
    );
    settlementRepository.context = {
      order: {
        id: '1',
        orderReference: 'settlement-order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'SENT_TO_BROKER',
        symbol: 'AAPL',
        stockId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        grossAmount: 250,
        reservedAmount: 251,
        currency: 'USD',
      },
      execution: {
        brokerName: 'ALPACA',
        externalOrderId: 'alpaca-settlement-reference',
        brokerStatus: 'ACCEPTED',
      },
    };

    return request(app.getHttpServer())
      .post('/api/v1/orders/settlement-order-reference/settlement/sync')
      .set('Authorization', 'Bearer trader-token')
      .send({
        actorId: 'broker-reviewer',
        notificationRecipient: {
          email: 'trader@nexus.local',
          name: 'Andy Trader',
        },
      })
      .expect(200)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          orderId: '1',
          orderReference: 'settlement-order-reference',
          traderId: '101',
          side: 'BUY',
          status: 'EXECUTED',
          symbol: 'AAPL',
          quantity: 1,
          filledQuantity: 1,
          averageFilledPrice: 250,
          settledAmount: 250,
          commissionAmount: 1,
          netAmount: 251,
          currency: 'USD',
          brokerName: 'ALPACA',
          externalOrderId: 'alpaca-settlement-reference',
          brokerStatus: 'filled',
          portfolioUpdated: true,
          fundsUpdated: true,
          notificationDelivered: true,
        });
        expect(body.settledAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/:orderReference/broker-validation approves an order (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/order-reference/broker-validation')
      .send({
        brokerId: '201',
        decision: 'APPROVE',
        reason: 'Order reviewed by assigned broker.',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          orderId: '1',
          orderReference: 'order-reference',
          brokerId: '201',
          decision: 'APPROVE',
          status: 'PENDING_EXECUTION',
          reason: 'Order reviewed by assigned broker.',
        });
        expect(body.validatedAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/:orderReference/broker-validation rejects an order (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/broker-rejected-order-reference/broker-validation')
      .send({
        brokerId: '201',
        decision: 'REJECT',
        reason: 'Risk policy did not approve this order.',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          orderId: '2',
          orderReference: 'broker-rejected-order-reference',
          brokerId: '201',
          decision: 'REJECT',
          status: 'REJECTED',
          reason: 'Risk policy did not approve this order.',
        });
        expect(body.validatedAt).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/buy/market (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/buy/market')
      .send({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        marketEvaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'PENDING_EXECUTION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 250,
          grossAmount: 250,
          reservedAmount: 251,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/buy/market blocks restricted traders (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/buy/market')
      .send({
        traderId: 'restricted-trader',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        marketEvaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(409)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Trader is restricted by compliance',
        });
      });
  });

  it('/api/v1/orders/buy/market queues when market is closed (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/buy/market')
      .send({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        marketEvaluatedAt: '2026-05-12T22:00:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          side: 'BUY',
          orderType: 'MARKET',
          status: 'PENDING_MARKET_OPEN',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 250,
          grossAmount: 250,
          reservedAmount: 251,
          currency: 'USD',
        });
      });
  });

  it('/api/v1/orders/:orderReference/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/orders/order-reference/status')
      .expect(200)
      .expect({
        orderId: '1',
        orderReference: 'order-reference',
        traderId: '101',
        side: 'BUY',
        orderType: 'MARKET',
        status: 'PENDING_EXECUTION',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        grossAmount: 250,
        reservedAmount: 250,
        currency: 'USD',
        createdAt: '2026-05-26T14:30:00.000Z',
        updatedAt: '2026-05-26T14:30:00.000Z',
      });
  });

  it('/api/v1/orders/:orderReference/status-history (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/orders/order-reference/status-history')
      .expect(200)
      .expect([
        {
          id: '1',
          orderId: '1',
          orderReference: 'order-reference',
          toStatus: 'PENDING_EXECUTION',
          actorType: 'TRADER',
          actorId: '101',
          reason: 'Market buy order created after funds reservation',
          createdAt: '2026-05-26T14:30:00.000Z',
        },
      ]);
  });

  it('/api/v1/orders/:orderReference/cancel (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/order-reference/cancel')
      .send({
        actorId: '101',
      })
      .expect(201)
      .expect({
        orderId: '1',
        orderReference: 'order-reference',
        previousStatus: 'PENDING_EXECUTION',
        currentStatus: 'CANCELLED',
        releasedAmount: 250,
        reason: 'Trader requested cancellation before execution',
      });
  });

  it('/api/v1/orders/buy/limit (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/buy/limit')
      .send({
        traderId: '101',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        limitPrice: 240,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          side: 'BUY',
          orderType: 'LIMIT',
          status: 'PENDING_CONDITION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 240,
          limitPrice: 240,
          grossAmount: 240,
          reservedAmount: 241,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/sell/market (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/sell/market')
      .send({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        estimatedUnitPrice: 250,
        marketEvaluatedAt: '2026-05-12T14:30:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          stockId: '1',
          side: 'SELL',
          orderType: 'MARKET',
          status: 'PENDING_EXECUTION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 250,
          grossAmount: 250,
          reservedAmount: 0,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/sell/limit (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/sell/limit')
      .send({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        limitPrice: 260,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          stockId: '1',
          side: 'SELL',
          orderType: 'LIMIT',
          status: 'PENDING_CONDITION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 260,
          limitPrice: 260,
          grossAmount: 260,
          reservedAmount: 0,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/sell/stop-loss (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/sell/stop-loss')
      .send({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        stopPrice: 220,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          stockId: '1',
          side: 'SELL',
          orderType: 'STOP_LOSS',
          status: 'PENDING_CONDITION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 220,
          limitPrice: 220,
          grossAmount: 220,
          reservedAmount: 0,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });

  it('/api/v1/orders/sell/take-profit (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders/sell/take-profit')
      .send({
        traderId: '101',
        stockId: '1',
        symbol: 'AAPL',
        exchangeId: '1',
        quantity: 1,
        targetPrice: 290,
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as Record<string, unknown>;
        expect(body).toMatchObject({
          traderId: '101',
          stockId: '1',
          side: 'SELL',
          orderType: 'TAKE_PROFIT',
          status: 'PENDING_CONDITION',
          symbol: 'AAPL',
          exchangeId: '1',
          quantity: 1,
          estimatedUnitPrice: 290,
          limitPrice: 290,
          grossAmount: 290,
          reservedAmount: 0,
          currency: 'USD',
        });
        expect(body.orderReference).toEqual(expect.any(String));
      });
  });
});
