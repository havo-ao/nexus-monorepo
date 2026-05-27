import { Module } from '@nestjs/common';
import { OrderCancellationController } from './controllers/order-cancellation.controller';
import { InMemoryOrderCancellationRepository } from './repositories/in-memory-order-cancellation.repository';
import { ORDER_CANCELLATION_REPOSITORY } from './repositories/order-cancellation.repository';
import { TypeOrmOrderCancellationRepository } from './repositories/typeorm-order-cancellation.repository';
import { OrderCancellationService } from './services/order-cancellation.service';

const orderCancellationRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryOrderCancellationRepository
    : TypeOrmOrderCancellationRepository;

@Module({
  controllers: [OrderCancellationController],
  providers: [
    OrderCancellationService,
    {
      provide: ORDER_CANCELLATION_REPOSITORY,
      useClass: orderCancellationRepository,
    },
  ],
})
export class OrderCancellationModule {}
