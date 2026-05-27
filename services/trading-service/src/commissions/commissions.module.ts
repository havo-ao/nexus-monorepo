import { Module } from '@nestjs/common';
import { CommissionCalculationController } from './controllers/commission-calculation.controller';
import { COMMISSION_CALCULATION_REPOSITORY } from './repositories/commission-calculation.repository';
import { InMemoryCommissionCalculationRepository } from './repositories/in-memory-commission-calculation.repository';
import { TypeOrmCommissionCalculationRepository } from './repositories/typeorm-commission-calculation.repository';
import { CommissionCalculationService } from './services/commission-calculation.service';

const commissionCalculationRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryCommissionCalculationRepository
    : TypeOrmCommissionCalculationRepository;

@Module({
  controllers: [CommissionCalculationController],
  providers: [
    CommissionCalculationService,
    {
      provide: COMMISSION_CALCULATION_REPOSITORY,
      useClass: commissionCalculationRepository,
    },
  ],
})
export class CommissionsModule {}
