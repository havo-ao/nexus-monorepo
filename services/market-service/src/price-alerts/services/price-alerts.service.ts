import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INSTRUMENTS_REPOSITORY } from '../../instruments/repositories/instruments.repository';
import type { InstrumentsRepository } from '../../instruments/repositories/instruments.repository';
import { QUOTES_REPOSITORY } from '../../quotes/repositories/quotes.repository';
import type { QuotesRepository } from '../../quotes/repositories/quotes.repository';
import { CreatePriceAlertDto } from '../dto/create-price-alert.dto';
import { EvaluatePriceAlertsResponseDto } from '../dto/evaluate-price-alerts-response.dto';
import { PriceAlertEventResponseDto } from '../dto/price-alert-event-response.dto';
import { PriceAlertResponseDto } from '../dto/price-alert-response.dto';
import { PriceAlert } from '../entities/price-alert.entity';
import type { PriceAlertCondition } from '../entities/price-alert.entity';
import { PriceAlertEvent } from '../entities/price-alert-event.entity';
import { PRICE_ALERTS_REPOSITORY } from '../repositories/price-alerts.repository';
import type { PriceAlertsRepository } from '../repositories/price-alerts.repository';

@Injectable()
export class PriceAlertsService {
  constructor(
    @Inject(PRICE_ALERTS_REPOSITORY)
    private readonly priceAlertsRepository: PriceAlertsRepository,
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
    @Inject(QUOTES_REPOSITORY)
    private readonly quotesRepository: QuotesRepository,
  ) {}

  async createAlert(dto: CreatePriceAlertDto): Promise<PriceAlertResponseDto> {
    const traderId = this.normalizeTraderId(dto.traderId);
    const symbol = this.normalizeSymbol(dto.symbol);
    const targetPrice = this.normalizeTargetPrice(dto.targetPrice);
    const condition = this.normalizeCondition(dto.condition);
    const instrument = await this.instrumentsRepository.findBySymbol(symbol);

    if (!instrument) {
      throw new NotFoundException(`Instrument ${symbol} is not available`);
    }

    const savedAlert = await this.priceAlertsRepository.saveAlert(
      PriceAlert.create({
        traderId,
        symbol,
        targetPrice,
        condition,
      }),
    );

    return this.toAlertResponse(savedAlert);
  }

  async getAlertsByTrader(traderId: string): Promise<PriceAlertResponseDto[]> {
    const normalizedTraderId = this.normalizeTraderId(traderId);
    const alerts =
      await this.priceAlertsRepository.findByTraderId(normalizedTraderId);

    return alerts.map((alert) => this.toAlertResponse(alert));
  }

  async evaluateAlerts(): Promise<EvaluatePriceAlertsResponseDto> {
    const activeAlerts = await this.priceAlertsRepository.findActiveAlerts();
    const triggeredEvents: PriceAlertEventResponseDto[] = [];

    for (const alert of activeAlerts) {
      const snapshot = alert.toSnapshot();
      const quote = await this.quotesRepository.findLatestBySymbol(
        snapshot.symbol,
      );

      if (!quote) {
        continue;
      }

      const marketPrice = quote.toSnapshot().price;

      if (!alert.isTriggeredBy(marketPrice) || !snapshot.id) {
        continue;
      }

      const occurredAt = new Date();
      const triggeredAlert = alert.markTriggered(occurredAt);
      const event = PriceAlertEvent.create({
        alertId: snapshot.id,
        traderId: snapshot.traderId,
        symbol: snapshot.symbol,
        targetPrice: snapshot.targetPrice,
        marketPrice,
        condition: snapshot.condition,
        occurredAt,
      });

      await this.priceAlertsRepository.markTriggered(triggeredAlert);
      await this.priceAlertsRepository.recordEvent(event);
      triggeredEvents.push(this.toEventResponse(event));
    }

    return {
      evaluatedCount: activeAlerts.length,
      triggeredCount: triggeredEvents.length,
      triggeredEvents,
    };
  }

  private normalizeTraderId(traderId: string): string {
    if (typeof traderId !== 'string' || !traderId.trim()) {
      throw new BadRequestException('traderId must be a non-empty string');
    }

    return traderId.trim();
  }

  private normalizeSymbol(symbol: string): string {
    if (typeof symbol !== 'string' || !symbol.trim()) {
      throw new BadRequestException('Symbol must be a non-empty string');
    }

    return symbol.trim().toUpperCase();
  }

  private normalizeTargetPrice(targetPrice: number): number {
    const parsedTargetPrice = Number(targetPrice);

    if (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice <= 0) {
      throw new BadRequestException('targetPrice must be a positive number');
    }

    return parsedTargetPrice;
  }

  private normalizeCondition(
    condition?: PriceAlertCondition,
  ): PriceAlertCondition {
    if (!condition) {
      return 'ABOVE_OR_EQUAL';
    }

    if (condition !== 'ABOVE_OR_EQUAL' && condition !== 'BELOW_OR_EQUAL') {
      throw new BadRequestException('condition is not supported');
    }

    return condition;
  }

  private toAlertResponse(alert: PriceAlert): PriceAlertResponseDto {
    const snapshot = alert.toSnapshot();

    return {
      id: Number(snapshot.id),
      traderId: snapshot.traderId,
      symbol: snapshot.symbol,
      targetPrice: snapshot.targetPrice,
      condition: snapshot.condition,
      status: snapshot.status,
      createdAt: snapshot.createdAt.toISOString(),
      triggeredAt: snapshot.triggeredAt
        ? snapshot.triggeredAt.toISOString()
        : null,
    };
  }

  private toEventResponse(event: PriceAlertEvent): PriceAlertEventResponseDto {
    const snapshot = event.toSnapshot();

    return {
      alertId: snapshot.alertId,
      traderId: snapshot.traderId,
      symbol: snapshot.symbol,
      targetPrice: snapshot.targetPrice,
      marketPrice: snapshot.marketPrice,
      condition: snapshot.condition,
      occurredAt: snapshot.occurredAt.toISOString(),
    };
  }
}
