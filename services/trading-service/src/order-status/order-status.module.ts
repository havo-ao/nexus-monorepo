import { Module } from '@nestjs/common';
import { OrderStatusController } from './controllers/order-status.controller';
import { InMemoryOrderStatusRepository } from './repositories/in-memory-order-status.repository';
import { ORDER_STATUS_REPOSITORY } from './repositories/order-status.repository';
import { TypeOrmOrderStatusRepository } from './repositories/typeorm-order-status.repository';
import { OrderStatusService } from './services/order-status.service';

const orderStatusRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryOrderStatusRepository
    : TypeOrmOrderStatusRepository;

@Module({
  controllers: [OrderStatusController],
  providers: [
    OrderStatusService,
    {
      provide: ORDER_STATUS_REPOSITORY,
      useClass: orderStatusRepository,
    },
  ],
})
export class OrderStatusModule {}
