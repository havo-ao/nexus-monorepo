import { Module } from '@nestjs/common';
import { HoldingsValidationController } from './controllers/holdings-validation.controller';
import { InMemoryTraderHoldingsRepository } from './repositories/in-memory-trader-holdings.repository';
import { TRADER_HOLDINGS_REPOSITORY } from './repositories/trader-holdings.repository';
import { TypeOrmTraderHoldingsRepository } from './repositories/typeorm-trader-holdings.repository';
import { HoldingsValidationService } from './services/holdings-validation.service';

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
