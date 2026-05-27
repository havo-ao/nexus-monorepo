import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrderHistoryModule } from './order-history/order-history.module';
import { ReportsModule } from './reports/reports.module';
import { RestrictionsModule } from './restrictions/restrictions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'src/.env'],
    }),
    AuditModule,
    HealthModule,
    NotificationsModule,
    OrderHistoryModule,
    ReportsModule,
    RestrictionsModule,
  ],
})
export class AppModule {}
