import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderHistoryModule } from '../order-history/order-history.module';
import { RestrictionsModule } from '../restrictions/restrictions.module';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    OrderHistoryModule,
    RestrictionsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
