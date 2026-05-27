export type ComplianceRestrictionStatus = 'CLEAR' | 'RESTRICTED';

export interface ComplianceRestriction {
  traderId: string;
  status: ComplianceRestrictionStatus;
  reason?: string;
  updatedBy: string;
  updatedAt: string;
}
