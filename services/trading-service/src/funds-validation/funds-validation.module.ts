import { Module } from '@nestjs/common';
import { FundsValidationController } from './presentation/http/funds-validation.controller';
import { InMemoryTraderFundsRepository } from './infrastructure/repositories/in-memory-trader-funds.repository';
import { TRADER_FUNDS_REPOSITORY } from './domain/repositories/trader-funds.repository';
import { TypeOrmTraderFundsRepository } from './infrastructure/repositories/typeorm-trader-funds.repository';
import { FundsValidationService } from './application/services/funds-validation.service';

const fundsRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryTraderFundsRepository
    : TypeOrmTraderFundsRepository;

@Module({
  controllers: [FundsValidationController],
  providers: [
    FundsValidationService,
    {
      provide: TRADER_FUNDS_REPOSITORY,
      useClass: fundsRepository,
    },
  ],
  exports: [FundsValidationService],
})
export class FundsValidationModule {}
