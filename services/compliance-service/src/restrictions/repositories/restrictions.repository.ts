import { Injectable } from '@nestjs/common';
import { ComplianceRestriction } from '../entities/restriction.entity';

@Injectable()
export class RestrictionsRepository {
  private readonly restrictions = new Map<string, ComplianceRestriction>();

  save(restriction: ComplianceRestriction): ComplianceRestriction {
    this.restrictions.set(restriction.traderId, restriction);
    return restriction;
  }

  findByTraderId(traderId: string): ComplianceRestriction | undefined {
    return this.restrictions.get(traderId);
  }

  findAll(): ComplianceRestriction[] {
    return [...this.restrictions.values()].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  countRestricted(): number {
    return this.findAll().filter((item) => item.status === 'RESTRICTED').length;
  }
}
