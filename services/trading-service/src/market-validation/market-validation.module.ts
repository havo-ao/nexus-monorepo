import { Module } from '@nestjs/common';
import { MarketValidationController } from './presentation/http/market-validation.controller';
import { InMemoryMarketStatusRepository } from './infrastructure/repositories/in-memory-market-status.repository';
import { MARKET_STATUS_REPOSITORY } from './domain/repositories/market-status.repository';
import { TypeOrmMarketStatusRepository } from './infrastructure/repositories/typeorm-market-status.repository';
import { MarketValidationService } from './application/services/market-validation.service';

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
