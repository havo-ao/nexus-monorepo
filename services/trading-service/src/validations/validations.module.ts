import { Module } from '@nestjs/common';
import { ValidationsController } from './controllers/validations.controller';
import { InMemoryTraderFundsRepository } from './repositories/in-memory-trader-funds.repository';
import { TRADER_FUNDS_REPOSITORY } from './repositories/trader-funds.repository';
import { TypeOrmTraderFundsRepository } from './repositories/typeorm-trader-funds.repository';
import { FundsValidationService } from './services/funds-validation.service';

const fundsRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryTraderFundsRepository
    : TypeOrmTraderFundsRepository;

@Module({
  controllers: [ValidationsController],
  providers: [
    FundsValidationService,
    {
      provide: TRADER_FUNDS_REPOSITORY,
      useClass: fundsRepository,
    },
  ],
  exports: [FundsValidationService],
})
export class ValidationsModule {}
