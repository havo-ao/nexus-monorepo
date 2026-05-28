import { Module } from '@nestjs/common';
import { CommissionCalculationController } from './controllers/commission-calculation.controller';
import { CommissionDistributionController } from './controllers/commission-distribution.controller';
import { COMMISSION_CALCULATION_REPOSITORY } from './repositories/commission-calculation.repository';
import { COMMISSION_DISTRIBUTION_REPOSITORY } from './repositories/commission-distribution.repository';
import { InMemoryCommissionCalculationRepository } from './repositories/in-memory-commission-calculation.repository';
import { InMemoryCommissionDistributionRepository } from './repositories/in-memory-commission-distribution.repository';
import { TypeOrmCommissionCalculationRepository } from './repositories/typeorm-commission-calculation.repository';
import { TypeOrmCommissionDistributionRepository } from './repositories/typeorm-commission-distribution.repository';
import { CommissionCalculationService } from './services/commission-calculation.service';
import { CommissionDistributionService } from './services/commission-distribution.service';

const commissionCalculationRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryCommissionCalculationRepository
    : TypeOrmCommissionCalculationRepository;
const commissionDistributionRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryCommissionDistributionRepository
    : TypeOrmCommissionDistributionRepository;

@Module({
  controllers: [
    CommissionCalculationController,
    CommissionDistributionController,
  ],
  providers: [
    CommissionCalculationService,
    CommissionDistributionService,
    {
      provide: COMMISSION_CALCULATION_REPOSITORY,
      useClass: commissionCalculationRepository,
    },
    {
      provide: COMMISSION_DISTRIBUTION_REPOSITORY,
      useClass: commissionDistributionRepository,
    },
  ],
})
export class CommissionsModule {}
