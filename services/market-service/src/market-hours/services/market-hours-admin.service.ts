import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigureMarketHoursDto } from '../dto/configure-market-hours.dto';
import { ConfigureMarketRestrictionDto } from '../dto/configure-market-restriction.dto';
import { MarketHoursConfigurationResponseDto } from '../dto/market-hours-configuration-response.dto';
import {
  MarketHours,
  MarketRestriction,
} from '../entities/market-hours.entity';
import { MARKET_HOURS_REPOSITORY } from '../repositories/market-hours.repository';
import type { MarketHoursRepository } from '../repositories/market-hours.repository';

@Injectable()
export class MarketHoursAdminService {
  constructor(
    @Inject(MARKET_HOURS_REPOSITORY)
    private readonly marketHoursRepository: MarketHoursRepository,
  ) {}

  async configureSchedule(
    marketCode: string,
    dto: ConfigureMarketHoursDto,
  ): Promise<MarketHoursConfigurationResponseDto> {
    const existing =
      await this.marketHoursRepository.findByMarketCode(marketCode);

    const marketHours = existing
      ? existing.configureSchedule({
          timezone: dto.timezone,
          openTime: dto.openTime,
          closeTime: dto.closeTime,
          operatingDays: dto.operatingDays,
        })
      : MarketHours.configure(marketCode, {
          timezone: dto.timezone,
          openTime: dto.openTime,
          closeTime: dto.closeTime,
          operatingDays: dto.operatingDays,
        });

    const saved = await this.marketHoursRepository.save(marketHours, {
      marketCode: marketHours.toSnapshot().marketCode,
      changeType: 'SCHEDULE_CONFIGURED',
      actor: dto.actor,
      context: 'NEX-83 schedule configuration',
    });

    return this.toConfigurationResponse(saved);
  }

  async configureRestriction(
    marketCode: string,
    dto: ConfigureMarketRestrictionDto,
  ): Promise<MarketHoursConfigurationResponseDto> {
    const marketHours =
      await this.marketHoursRepository.findByMarketCode(marketCode);

    if (!marketHours) {
      throw new BadRequestException(
        `Market ${marketCode} must be configured before adding restrictions`,
      );
    }

    const saved = await this.marketHoursRepository.save(
      marketHours.upsertRestriction(this.toRestriction(dto)),
      {
        marketCode: marketHours.toSnapshot().marketCode,
        changeType: 'RESTRICTION_CONFIGURED',
        actor: dto.actor,
        context: 'NEX-83 restriction configuration',
      },
    );

    return this.toConfigurationResponse(saved);
  }

  private toRestriction(dto: ConfigureMarketRestrictionDto): MarketRestriction {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.date)) {
      throw new BadRequestException('Restriction date must use YYYY-MM-DD');
    }

    if (dto.status !== 'CLOSED' && dto.status !== 'RESTRICTED') {
      throw new BadRequestException(
        'Restriction status must be CLOSED or RESTRICTED',
      );
    }

    if (typeof dto.reason !== 'string' || !dto.reason.trim()) {
      throw new BadRequestException('Restriction reason is required');
    }

    return {
      date: dto.date,
      status: dto.status,
      reason: dto.reason.trim(),
    };
  }

  private toConfigurationResponse(
    marketHours: MarketHours,
  ): MarketHoursConfigurationResponseDto {
    const snapshot = marketHours.toSnapshot();
    const currentStatus = marketHours.evaluate(new Date());

    return {
      marketCode: snapshot.marketCode,
      timezone: snapshot.timezone,
      openTime: snapshot.openTime,
      closeTime: snapshot.closeTime,
      operatingDays: snapshot.operatingDays,
      restrictions: snapshot.restrictions,
      currentStatus: {
        marketCode: currentStatus.marketCode,
        status: currentStatus.status,
        canProcessOrder: currentStatus.canProcessOrder,
        evaluatedAt: currentStatus.evaluatedAt.toISOString(),
        timezone: currentStatus.timezone,
        reason: currentStatus.reason,
      },
    };
  }
}
