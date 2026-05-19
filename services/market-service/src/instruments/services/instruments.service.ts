import { Inject, Injectable } from '@nestjs/common';
import { InstrumentResponseDto } from '../dto/instrument-response.dto';
import { Instrument } from '../entities/instrument.entity';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';

@Injectable()
export class InstrumentsService {
  constructor(
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
  ) {}

  async getAvailableInstruments(): Promise<InstrumentResponseDto[]> {
    const instruments = await this.instrumentsRepository.findAvailable();

    return instruments.map((instrument) => this.toResponse(instrument));
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
}
