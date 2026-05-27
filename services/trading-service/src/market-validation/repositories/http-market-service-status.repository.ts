import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { stripTrailingSlashes } from '../../common/url';
import { MarketExchange } from '../../market/entities/market-exchange.entity';
import type { MarketStatus } from '../entities/market-validation.entity';
import { MarketValidationEvent } from '../entities/market-validation-event.entity';
import type {
  MarketStatusRepository,
  MarketValidationResult,
} from './market-status.repository';

type MarketServiceStatusResponse = {
  marketCode?: string;
  status?: string;
  canProcessOrder?: boolean;
  evaluatedAt?: string;
  timezone?: string;
  reason?: string;
};

@Injectable()
export class HttpMarketServiceStatusRepository implements MarketStatusRepository {
  constructor(private readonly dataSource: DataSource) {}

  validateMarketStatus(
    exchangeId: string,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult> {
    return this.dataSource.transaction((manager) =>
      this.validateMarketStatusInTransaction(manager, exchangeId, evaluatedAt),
    );
  }

  private async validateMarketStatusInTransaction(
    manager: EntityManager,
    exchangeId: string,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult> {
    const exchange = await manager.getRepository(MarketExchange).findOne({
      where: { id: exchangeId },
    });
    const result = await this.getMarketServiceStatus(
      exchangeId,
      exchange,
      evaluatedAt,
    );

    await manager.getRepository(MarketValidationEvent).save(
      this.toEvent({
        ...result,
        openTime: exchange?.openTime,
        closeTime: exchange?.closeTime,
      }),
    );

    return {
      ...result,
      openTime: exchange?.openTime,
      closeTime: exchange?.closeTime,
    };
  }

  private async getMarketServiceStatus(
    exchangeId: string,
    exchange: MarketExchange | null,
    evaluatedAt: Date,
  ): Promise<MarketValidationResult> {
    const baseUrl = process.env.MARKET_SERVICE_URL?.trim();
    if (!baseUrl) {
      return this.toRestrictedResult(
        exchangeId,
        evaluatedAt,
        'Market service URL is not configured',
      );
    }

    const marketCode = exchange?.name?.trim() || exchangeId;
    const requestUrl = `${stripTrailingSlashes(
      baseUrl,
    )}/api/v1/market-hours/${encodeURIComponent(
      marketCode,
    )}/status?at=${encodeURIComponent(evaluatedAt.toISOString())}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const response = await fetch(requestUrl, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      const body = (await this.parseResponse(
        response,
      )) as MarketServiceStatusResponse;

      if (!response.ok) {
        return this.toRestrictedResult(
          exchangeId,
          evaluatedAt,
          this.getErrorMessage(body, response.status),
        );
      }

      return this.toValidationResult(exchangeId, evaluatedAt, exchange, body);
    } catch (error) {
      return this.toRestrictedResult(
        exchangeId,
        evaluatedAt,
        error instanceof Error && error.name === 'AbortError'
          ? 'Market service request timed out'
          : 'Market service is unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private toValidationResult(
    exchangeId: string,
    evaluatedAt: Date,
    exchange: MarketExchange | null,
    body: MarketServiceStatusResponse,
  ): MarketValidationResult {
    const marketStatus = this.toMarketStatus(body.status);
    return {
      canOperate: Boolean(body.canProcessOrder) && marketStatus === 'OPEN',
      exchangeId,
      marketStatus,
      evaluatedAt: body.evaluatedAt ? new Date(body.evaluatedAt) : evaluatedAt,
      timezone: body.timezone ?? exchange?.timezone,
      reason: body.reason,
    };
  }

  private toMarketStatus(status: string | undefined): MarketStatus {
    const normalized = status?.trim().toUpperCase();
    return normalized === 'OPEN' ||
      normalized === 'CLOSED' ||
      normalized === 'RESTRICTED'
      ? normalized
      : 'RESTRICTED';
  }

  private toRestrictedResult(
    exchangeId: string,
    evaluatedAt: Date,
    reason: string,
  ): MarketValidationResult {
    return {
      canOperate: false,
      exchangeId,
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      reason,
    };
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

  private getErrorMessage(
    body: MarketServiceStatusResponse,
    status: number,
  ): string {
    return body.reason || `Market service rejected validation with ${status}`;
  }

  private getTimeoutMs(): number {
    const configuredTimeout = Number(process.env.MARKET_SERVICE_TIMEOUT_MS);
    return Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 3000;
  }

  private toEvent(result: MarketValidationResult): MarketValidationEvent {
    const event = new MarketValidationEvent();
    event.exchangeId = result.exchangeId;
    event.marketStatus = result.marketStatus;
    event.canOperate = result.canOperate;
    event.evaluatedAt = result.evaluatedAt;
    event.timezone = result.timezone;
    event.openTime = result.openTime;
    event.closeTime = result.closeTime;
    event.reason = result.reason;
    return event;
  }
}
