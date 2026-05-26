import { Module } from '@nestjs/common';
import { MarketValidationController } from './controllers/market-validation.controller';
import { InMemoryMarketStatusRepository } from './repositories/in-memory-market-status.repository';
import { MARKET_STATUS_REPOSITORY } from './repositories/market-status.repository';
import { TypeOrmMarketStatusRepository } from './repositories/typeorm-market-status.repository';
import { MarketValidationService } from './services/market-validation.service';

const marketStatusRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryMarketStatusRepository
    : TypeOrmMarketStatusRepository;

@Module({
  controllers: [MarketValidationController],
  providers: [
    MarketValidationService,
    {
      provide: MARKET_STATUS_REPOSITORY,
      useClass: marketStatusRepository,
    },
  ],
  exports: [MarketValidationService],
})
export class MarketValidationModule {}
