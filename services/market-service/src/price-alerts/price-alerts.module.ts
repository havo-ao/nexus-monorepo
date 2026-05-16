import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { InstrumentsModule } from '../instruments/instruments.module';
import { QuotesModule } from '../quotes/quotes.module';
import { PriceAlertsController } from './controllers/price-alerts.controller';
import { InMemoryPriceAlertsRepository } from './repositories/in-memory-price-alerts.repository';
import { MysqlPriceAlertsRepository } from './repositories/mysql-price-alerts.repository';
import { PRICE_ALERTS_REPOSITORY } from './repositories/price-alerts.repository';
import { PriceAlertsService } from './services/price-alerts.service';

@Module({
  imports: [DatabaseModule, InstrumentsModule, QuotesModule],
  controllers: [PriceAlertsController],
  providers: [
    PriceAlertsService,
    InMemoryPriceAlertsRepository,
    MysqlPriceAlertsRepository,
    {
      provide: PRICE_ALERTS_REPOSITORY,
      useFactory: (
        inMemoryRepository: InMemoryPriceAlertsRepository,
        mysqlRepository: MysqlPriceAlertsRepository,
      ) =>
        process.env.PRICE_ALERTS_REPOSITORY === 'mysql'
          ? mysqlRepository
          : inMemoryRepository,
      inject: [InMemoryPriceAlertsRepository, MysqlPriceAlertsRepository],
    },
  ],
})
export class PriceAlertsModule {}
