import { Inject, Injectable } from '@nestjs/common';
import { SyncInstrumentsResponseDto } from '../dto/sync-instruments-response.dto';
import { Instrument } from '../entities/instrument.entity';
import {
  INSTRUMENT_CATALOG_PROVIDER,
  type InstrumentCatalogProvider,
} from '../providers/instrument-catalog.provider';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentsService } from './instruments.service';

@Injectable()
export class InstrumentsSyncService {
  constructor(
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
    @Inject(INSTRUMENT_CATALOG_PROVIDER)
    private readonly instrumentCatalogProvider: InstrumentCatalogProvider,
    private readonly instrumentsService: InstrumentsService,
  ) {}

  async synchronizeInstruments(): Promise<SyncInstrumentsResponseDto> {
    try {
      const providerInstruments =
        await this.instrumentCatalogProvider.fetchInstruments();
      const instruments = providerInstruments.map((instrument) =>
        Instrument.restore(instrument),
      );

      await this.instrumentsRepository.saveInstruments(instruments);

      return {
        status: 'SUCCESS',
        provider: this.instrumentCatalogProvider.name,
        updatedCount: instruments.length,
        preservedLocalCatalog: false,
        instruments: instruments.map((instrument) =>
          this.instrumentsService.toResponse(instrument),
        ),
        message: `Synchronized ${instruments.length} available instruments`,
      };
    } catch {
      const localInstruments = await this.instrumentsRepository.findAvailable();

      return {
        status: 'FAILED',
        provider: this.instrumentCatalogProvider.name,
        updatedCount: 0,
        preservedLocalCatalog: true,
        instruments: localInstruments.map((instrument) =>
          this.instrumentsService.toResponse(instrument),
        ),
        message:
          'Instrument catalog provider failed; preserved local catalog when available',
      };
    }
  }
}
