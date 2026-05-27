import { Injectable } from '@nestjs/common';
import { stripTrailingSlashes } from '../../common/url';
import { ComplianceValidation } from '../entities/compliance-validation.entity';
import type {
  ComplianceRestrictionsClient,
  ValidateComplianceOperationCommand,
} from './compliance-restrictions.client';

type ComplianceValidationResponse = {
  traderId?: string;
  operation?: string;
  allowed?: boolean;
  status?: string;
  reason?: string;
  message?: string;
};

@Injectable()
export class HttpComplianceRestrictionsClient implements ComplianceRestrictionsClient {
  async validateOperation(
    command: ValidateComplianceOperationCommand,
  ): Promise<ComplianceValidation> {
    const baseUrl = process.env.COMPLIANCE_SERVICE_URL?.trim();
    if (!baseUrl) {
      return this.toBlockedValidation(
        command,
        'Compliance service URL is not configured',
      );
    }

    const requestUrl = `${stripTrailingSlashes(
      baseUrl,
    )}/api/v1/restrictions/validate-operation`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          traderId: command.traderId,
          operation: command.operation,
          sourceService: 'trading-service',
        }),
        signal: controller.signal,
      });
      const body = (await this.parseResponse(
        response,
      )) as ComplianceValidationResponse;

      if (!response.ok) {
        return this.toBlockedValidation(
          command,
          body.reason ||
            body.message ||
            `Compliance service rejected validation with ${response.status}`,
        );
      }

      return new ComplianceValidation(
        body.traderId ?? command.traderId,
        command.operation,
        body.allowed === true,
        body.status ?? 'UNKNOWN',
        body.reason,
      );
    } catch (error) {
      return this.toBlockedValidation(
        command,
        error instanceof Error && error.name === 'AbortError'
          ? 'Compliance service request timed out'
          : 'Compliance service is unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private toBlockedValidation(
    command: ValidateComplianceOperationCommand,
    reason: string,
  ): ComplianceValidation {
    return new ComplianceValidation(
      command.traderId,
      command.operation,
      false,
      'UNAVAILABLE',
      reason,
    );
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const responseText = await response.text();
    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText) as unknown;
    } catch {
      return { message: responseText };
    }
  }

  private getTimeoutMs(): number {
    const configuredTimeout = Number(process.env.COMPLIANCE_SERVICE_TIMEOUT_MS);
    return Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 3000;
  }
}
