import { Module } from '@nestjs/common';
import { HoldingsValidationController } from './presentation/http/holdings-validation.controller';
import { InMemoryTraderHoldingsRepository } from './infrastructure/repositories/in-memory-trader-holdings.repository';
import { TRADER_HOLDINGS_REPOSITORY } from './domain/repositories/trader-holdings.repository';
import { TypeOrmTraderHoldingsRepository } from './infrastructure/repositories/typeorm-trader-holdings.repository';
import { HoldingsValidationService } from './application/services/holdings-validation.service';

const holdingsRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryTraderHoldingsRepository
    : TypeOrmTraderHoldingsRepository;

@Module({
  controllers: [HoldingsValidationController],
  providers: [
    HoldingsValidationService,
    {
      provide: TRADER_HOLDINGS_REPOSITORY,
      useClass: holdingsRepository,
    },
  ],
  exports: [HoldingsValidationService],
})
export class HoldingsValidationModule {}
