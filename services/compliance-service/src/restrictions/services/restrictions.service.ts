import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/services/audit.service';
import { UpsertRestrictionDto } from '../dto/upsert-restriction.dto';
import { ValidateOperationDto } from '../dto/validate-operation.dto';
import { ComplianceRestriction } from '../entities/restriction.entity';
import { RestrictionsRepository } from '../repositories/restrictions.repository';

@Injectable()
export class RestrictionsService {
  constructor(
    private readonly restrictionsRepository: RestrictionsRepository,
    private readonly auditService: AuditService,
  ) {}

  upsert(traderId: string, dto: UpsertRestrictionDto): ComplianceRestriction {
    const restriction = this.restrictionsRepository.save({
      traderId,
      status: dto.status,
      reason: dto.reason?.trim(),
      updatedBy: dto.updatedBy.trim(),
      updatedAt: new Date().toISOString(),
    });

    this.auditService.record({
      eventType: 'COMPLIANCE_RESTRICTION_UPDATED',
      sourceService: 'compliance-service',
      actorId: restriction.updatedBy,
      actorRole: 'COMPLIANCE',
      entityType: 'TRADER',
      entityId: traderId,
      result: 'SUCCESS',
      critical: true,
      context: {
        status: restriction.status,
        reason: restriction.reason,
      },
      occurredAt: restriction.updatedAt,
    });

    return restriction;
  }

  findByTraderId(traderId: string): ComplianceRestriction {
    return (
      this.restrictionsRepository.findByTraderId(traderId) ?? {
        traderId,
        status: 'CLEAR',
        updatedBy: 'system',
        updatedAt: new Date().toISOString(),
      }
    );
  }

  validateOperation(dto: ValidateOperationDto) {
    const restriction = this.findByTraderId(dto.traderId);
    const allowed = restriction.status !== 'RESTRICTED';

    this.auditService.record({
      eventType: 'COMPLIANCE_OPERATION_VALIDATED',
      sourceService: dto.sourceService,
      actorId: dto.traderId,
      actorRole: 'TRADER',
      entityType: 'TRADER',
      entityId: dto.traderId,
      result: allowed ? 'SUCCESS' : 'FAILURE',
      critical: !allowed,
      context: {
        operation: dto.operation,
        restrictionStatus: restriction.status,
        reason: restriction.reason,
      },
    });

    return {
      traderId: dto.traderId,
      operation: dto.operation,
      allowed,
      status: restriction.status,
      reason: allowed ? undefined : restriction.reason,
    };
  }

  countRestricted(): number {
    return this.restrictionsRepository.countRestricted();
  }
}
