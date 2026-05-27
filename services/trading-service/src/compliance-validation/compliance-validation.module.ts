import { Module } from '@nestjs/common';
import { COMPLIANCE_RESTRICTIONS_CLIENT } from './clients/compliance-restrictions.client';
import { HttpComplianceRestrictionsClient } from './clients/http-compliance-restrictions.client';
import { InMemoryComplianceRestrictionsClient } from './clients/in-memory-compliance-restrictions.client';
import { COMPLIANCE_VALIDATION_REPOSITORY } from './repositories/compliance-validation.repository';
import { InMemoryComplianceValidationRepository } from './repositories/in-memory-compliance-validation.repository';
import { TypeOrmComplianceValidationRepository } from './repositories/typeorm-compliance-validation.repository';
import { ComplianceValidationService } from './services/compliance-validation.service';

const complianceRestrictionsClient =
  process.env.NODE_ENV === 'test'
    ? InMemoryComplianceRestrictionsClient
    : HttpComplianceRestrictionsClient;

const complianceValidationRepository =
  process.env.NODE_ENV === 'test'
    ? InMemoryComplianceValidationRepository
    : TypeOrmComplianceValidationRepository;

@Module({
  providers: [
    ComplianceValidationService,
    {
      provide: COMPLIANCE_RESTRICTIONS_CLIENT,
      useClass: complianceRestrictionsClient,
    },
    {
      provide: COMPLIANCE_VALIDATION_REPOSITORY,
      useClass: complianceValidationRepository,
    },
  ],
  exports: [ComplianceValidationService],
})
export class ComplianceValidationModule {}
