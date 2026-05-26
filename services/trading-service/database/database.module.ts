import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundsValidationEvent } from '../src/funds-validation/domain/entities/funds-validation-event.entity';
import { HoldingsValidationEvent } from '../src/holdings-validation/domain/entities/holdings-validation-event.entity';
import { MarketExchange } from '../src/market/domain/entities/market-exchange.entity';
import { MarketValidationEvent } from '../src/market-validation/domain/entities/market-validation-event.entity';
import { OrderStatusEventEntity } from '../src/orders/domain/entities/order-status-event.entity';
import { TradingOrderEntity } from '../src/orders/domain/entities/trading-order.entity';
import { PortfolioPosition } from '../src/portfolio/domain/entities/portfolio-position.entity';
import { Wallet } from '../src/wallet/domain/entities/wallet.entity';

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
