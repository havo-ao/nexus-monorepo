import { Module } from '@nestjs/common';
import { AlpacaBrokerClient } from '../executions/clients/alpaca-broker.client';
import { EXTERNAL_BROKER_CLIENT } from '../executions/clients/external-broker.client';
import { ComplianceNotificationClient } from './clients/compliance-notification.client';
import { HttpPortfolioSettlementClient } from './clients/http-portfolio-settlement.client';
import { InMemoryPortfolioSettlementClient } from './clients/in-memory-portfolio-settlement.client';
import { InMemoryTradingNotificationClient } from './clients/in-memory-trading-notification.client';
import { PORTFOLIO_SETTLEMENT_CLIENT } from './clients/portfolio-settlement.client';
import { TRADING_NOTIFICATION_CLIENT } from './clients/trading-notification.client';
import { OrderSettlementController } from './controllers/order-settlement.controller';
import { InMemoryOrderSettlementRepository } from './repositories/in-memory-order-settlement.repository';
import { ORDER_SETTLEMENT_REPOSITORY } from './repositories/order-settlement.repository';
import { TypeOrmOrderSettlementRepository } from './repositories/typeorm-order-settlement.repository';
import { OrderSettlementService } from './services/order-settlement.service';

const settlementRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryOrderSettlementRepository
    : TypeOrmOrderSettlementRepository;

const notificationClient =
  process.env.NODE_ENV === 'test'
    ? InMemoryTradingNotificationClient
    : ComplianceNotificationClient;

const portfolioSettlementClient =
  process.env.NODE_ENV === 'test'
    ? InMemoryPortfolioSettlementClient
    : HttpPortfolioSettlementClient;

@Module({
  controllers: [OrderSettlementController],
  providers: [
    OrderSettlementService,
    {
      provide: ORDER_SETTLEMENT_REPOSITORY,
      useClass: settlementRepository,
    },
    {
      provide: EXTERNAL_BROKER_CLIENT,
      useClass: AlpacaBrokerClient,
    },
    {
      provide: TRADING_NOTIFICATION_CLIENT,
      useClass: notificationClient,
    },
    {
      provide: PORTFOLIO_SETTLEMENT_CLIENT,
      useClass: portfolioSettlementClient,
    },
  ],
})
export class SettlementsModule {}
