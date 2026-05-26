import { Module } from '@nestjs/common';
import { HoldingsValidationModule } from '../holdings-validation/holdings-validation.module';
import { MarketValidationModule } from '../market-validation/market-validation.module';
import { OrdersController } from './presentation/http/orders.controller';
import { InMemoryOrderRepository } from './infrastructure/repositories/in-memory-order.repository';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository';
import { TypeOrmOrderRepository } from './infrastructure/repositories/typeorm-order.repository';
import { OrdersService } from './application/services/orders.service';

const orderRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryOrderRepository
    : TypeOrmOrderRepository;

@Module({
  imports: [HoldingsValidationModule, MarketValidationModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: ORDER_REPOSITORY,
      useClass: orderRepository,
    },
  ],
})
export class OrdersModule {}
