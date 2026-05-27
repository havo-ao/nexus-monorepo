import { Module } from '@nestjs/common';
import { ComplianceValidationModule } from '../compliance-validation/compliance-validation.module';
import { HoldingsValidationModule } from '../holdings-validation/holdings-validation.module';
import { MarketValidationModule } from '../market-validation/market-validation.module';
import { OrdersController } from './controllers/orders.controller';
import { InMemoryOrderRepository } from './repositories/in-memory-order.repository';
import { ORDER_REPOSITORY } from './repositories/order.repository';
import { TypeOrmOrderRepository } from './repositories/typeorm-order.repository';
import { OrdersService } from './services/orders.service';

const orderRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryOrderRepository
    : TypeOrmOrderRepository;

@Module({
  imports: [
    ComplianceValidationModule,
    HoldingsValidationModule,
    MarketValidationModule,
  ],
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
