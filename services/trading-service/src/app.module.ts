import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { BrokerValidationModule } from './broker-validation/broker-validation.module';
import { CommissionsModule } from './commissions/commissions.module';
import { ExecutionsModule } from './executions/executions.module';
import { FundsValidationModule } from './funds-validation/funds-validation.module';
import { HoldingsValidationModule } from './holdings-validation/holdings-validation.module';
import { MarketValidationModule } from './market-validation/market-validation.module';
import { OrderCancellationModule } from './order-cancellation/order-cancellation.module';
import { OrderStatusModule } from './order-status/order-status.module';
import { OrdersModule } from './orders/orders.module';
import { PendingOrdersModule } from './pending-orders/pending-orders.module';
import { SettlementsModule } from './settlements/settlements.module';

const databaseImports = process.env.NODE_ENV === 'test' ? [] : [DatabaseModule];

@Module({
  imports: [
    ...databaseImports,
    BrokerValidationModule,
    CommissionsModule,
    ExecutionsModule,
    FundsValidationModule,
    HoldingsValidationModule,
    MarketValidationModule,
    OrderCancellationModule,
    OrderStatusModule,
    OrdersModule,
    PendingOrdersModule,
    SettlementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
