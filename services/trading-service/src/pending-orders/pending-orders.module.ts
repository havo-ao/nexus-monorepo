import { Module } from '@nestjs/common';
import { MarketValidationModule } from '../market-validation/market-validation.module';
import { HttpMarketPriceClient } from './clients/http-market-price.client';
import { InMemoryMarketPriceClient } from './clients/in-memory-market-price.client';
import { MARKET_PRICE_CLIENT } from './clients/market-price.client';
import { PendingOrderProcessingController } from './controllers/pending-order-processing.controller';
import { InMemoryPendingOrderRepository } from './repositories/in-memory-pending-order.repository';
import { PENDING_ORDER_REPOSITORY } from './repositories/pending-order.repository';
import { TypeOrmPendingOrderRepository } from './repositories/typeorm-pending-order.repository';
import { PendingOrderProcessingService } from './services/pending-order-processing.service';
import { PendingOrderRunnerService } from './services/pending-order-runner.service';

const pendingOrderRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryPendingOrderRepository
    : TypeOrmPendingOrderRepository;

const marketPriceClient =
  process.env.NODE_ENV === 'test'
    ? InMemoryMarketPriceClient
    : HttpMarketPriceClient;

@Module({
  imports: [MarketValidationModule],
  controllers: [PendingOrderProcessingController],
  providers: [
    PendingOrderProcessingService,
    PendingOrderRunnerService,
    {
      provide: PENDING_ORDER_REPOSITORY,
      useClass: pendingOrderRepository,
    },
    {
      provide: MARKET_PRICE_CLIENT,
      useClass: marketPriceClient,
    },
  ],
})
export class PendingOrdersModule {}
