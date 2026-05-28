import { Inject, Injectable } from '@nestjs/common';
import { InstrumentResponseDto } from '../dto/instrument-response.dto';
import { Instrument } from '../entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { isSupportedEquity } from '../utils/supported-equity.util';
import { isSupportedSymbol } from '../utils/supported-symbols.util';

const DEFAULT_INSTRUMENT_LIMIT = 500;

@Injectable()
export class InstrumentsService {
  constructor(
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
  ) {}

  async getAvailableInstruments(): Promise<InstrumentResponseDto[]> {
    const instruments = await this.instrumentsRepository.findAvailable();

    return instruments
      .filter((instrument) => {
        const snapshot = instrument.toSnapshot();

        return (
          isSupportedEquity(snapshot) && isSupportedSymbol(snapshot.symbol)
        );
      })
      .slice(0, this.resolveInstrumentLimit())
      .map((instrument) => this.toResponse(instrument));
  }

  toResponse(instrument: Instrument): InstrumentResponseDto {
    const snapshot = instrument.toSnapshot();

    return {
      symbol: snapshot.symbol,
      name: snapshot.name,
      marketCode: snapshot.marketCode,
      currency: snapshot.currency,
      sector: snapshot.sector,
      status: snapshot.status,
    };
  }

  private resolveInstrumentLimit(): number {
    const configuredLimit = process.env.ALPHA_VANTAGE_INSTRUMENT_LIMIT?.trim();
    const instrumentLimit = configuredLimit
      ? Number(configuredLimit)
      : DEFAULT_INSTRUMENT_LIMIT;

    if (!Number.isInteger(instrumentLimit) || instrumentLimit <= 0) {
      return DEFAULT_INSTRUMENT_LIMIT;
    }

    return instrumentLimit;
  }
}
