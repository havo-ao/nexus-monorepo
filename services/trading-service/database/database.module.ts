import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionCalculationEvent } from '../src/commissions/entities/commission-calculation-event.entity';
import { CommissionDistributionEvent } from '../src/commissions/entities/commission-distribution-event.entity';
import { FundsValidationEvent } from '../src/funds-validation/entities/funds-validation-event.entity';
import { HoldingsValidationEvent } from '../src/holdings-validation/entities/holdings-validation-event.entity';
import { MarketExchange } from '../src/market/entities/market-exchange.entity';
import { MarketValidationEvent } from '../src/market-validation/entities/market-validation-event.entity';
import { OrderStatusEventEntity } from '../src/orders/entities/order-status-event.entity';
import { TradingOrderEntity } from '../src/orders/entities/trading-order.entity';
import { PortfolioPosition } from '../src/portfolio/entities/portfolio-position.entity';
import { Wallet } from '../src/wallet/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3307),
      username: process.env.DB_USERNAME ?? 'nexus_user',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? 'nexus',
      entities: [
        CommissionCalculationEvent,
        CommissionDistributionEvent,
        FundsValidationEvent,
        HoldingsValidationEvent,
        MarketExchange,
        MarketValidationEvent,
        OrderStatusEventEntity,
        PortfolioPosition,
        TradingOrderEntity,
        Wallet,
      ],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
