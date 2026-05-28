import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SyncInstrumentMetadataResponseDto } from '../dto/sync-instrument-metadata-response.dto';
import {
  INSTRUMENT_METADATA_PROVIDER,
  type InstrumentMetadataProvider,
} from '../providers/instrument-metadata.provider';
import { INSTRUMENTS_REPOSITORY } from '../repositories/instruments.repository';
import type { InstrumentsRepository } from '../repositories/instruments.repository';
import { InstrumentDetailService } from './instrument-detail.service';

@Injectable()
export class InstrumentMetadataSyncService {
  constructor(
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: InstrumentsRepository,
    @Inject(INSTRUMENT_METADATA_PROVIDER)
    private readonly instrumentMetadataProvider: InstrumentMetadataProvider,
    private readonly instrumentDetailService: InstrumentDetailService,
  ) {}

  async synchronizeMetadata(
    symbol: string,
  ): Promise<SyncInstrumentMetadataResponseDto> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const currentInstrument =
      await this.instrumentsRepository.findBySymbol(normalizedSymbol);

    if (!currentInstrument) {
      throw new NotFoundException(
        `Instrument ${normalizedSymbol} is not available`,
      );
    }

    try {
      const providerMetadata =
        await this.instrumentMetadataProvider.fetchMetadata(normalizedSymbol);
      const currentSnapshot = currentInstrument.toSnapshot();

      await this.instrumentsRepository.updateInstrumentMetadata(
        normalizedSymbol,
        {
          ...providerMetadata,
          symbol: normalizedSymbol,
          name: providerMetadata.name ?? currentSnapshot.name,
          sector: providerMetadata.sector ?? currentSnapshot.sector,
          currency: providerMetadata.currency ?? currentSnapshot.currency,
          marketCode: currentSnapshot.marketCode,
          status: currentSnapshot.status,
        },
      );

      return {
        status: 'SUCCESS',
        provider: this.instrumentMetadataProvider.name,
        symbol: normalizedSymbol,
        preservedLastKnownMetadata: false,
        message: `Synchronized metadata for ${normalizedSymbol}`,
        instrument:
          await this.instrumentDetailService.getInstrumentDetail(
            normalizedSymbol,
          ),
      };
    } catch {
      return {
        status: 'FAILED',
        provider: this.instrumentMetadataProvider.name,
        symbol: normalizedSymbol,
        preservedLastKnownMetadata: true,
        message:
          'Instrument metadata provider failed; preserved last known metadata when available',
        instrument:
          await this.instrumentDetailService.getInstrumentDetail(
            normalizedSymbol,
          ),
      };
    }
  }

  private normalizeSymbol(symbol: string): string {
    if (typeof symbol !== 'string' || !symbol.trim()) {
      throw new BadRequestException('Symbol must be a non-empty string');
    }

    return symbol.trim().toUpperCase();
  }
}
