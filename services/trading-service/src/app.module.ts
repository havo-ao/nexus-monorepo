import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { CommissionsModule } from './commissions/commissions.module';
import { FundsValidationModule } from './funds-validation/funds-validation.module';
import { HoldingsValidationModule } from './holdings-validation/holdings-validation.module';
import { MarketValidationModule } from './market-validation/market-validation.module';
import { OrderStatusModule } from './order-status/order-status.module';
import { OrdersModule } from './orders/orders.module';

const databaseImports = process.env.NODE_ENV === 'test' ? [] : [DatabaseModule];

@Module({
  imports: [
    ...databaseImports,
    CommissionsModule,
    FundsValidationModule,
    HoldingsValidationModule,
    MarketValidationModule,
    OrderStatusModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
