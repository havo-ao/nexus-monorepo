import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OrderHistoryController } from './controllers/order-history.controller';
import { OrderHistoryRepository } from './repositories/order-history.repository';
import { OrderHistoryService } from './services/order-history.service';

@Module({
  imports: [AuditModule],
  controllers: [OrderHistoryController],
  providers: [OrderHistoryRepository, OrderHistoryService],
  exports: [OrderHistoryService],
})
export class OrderHistoryModule {}
