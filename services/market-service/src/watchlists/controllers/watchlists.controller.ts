import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AddWatchlistItemDto } from '../dto/add-watchlist-item.dto';
import { WatchlistResponseDto } from '../dto/watchlist-response.dto';
import { WatchlistsService } from '../services/watchlists.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('watchlists')
@Controller({
  path: 'watchlists',
  version: '1',
})
@Roles('TRADER', 'ADMIN')
export class WatchlistsController {
  constructor(private readonly watchlistsService: WatchlistsService) {}

  @Get(':traderId')
  @ApiOperation({
    summary: 'Get trader watchlist',
    description:
      'Historia NEX-80: permite consultar la watchlist del trader con cotizacion actual disponible. Trazabilidad: EC-MOD-02, EC-REND-03, ASR-19, ASR-24.',
  })
  @ApiParam({ name: 'traderId', example: 'trader-123' })
  @ApiOkResponse({ type: WatchlistResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid trader id' })
  getWatchlist(
    @Param('traderId') traderId: string,
  ): Promise<WatchlistResponseDto> {
    return this.watchlistsService.getWatchlist(traderId);
  }

  @Post(':traderId/items')
  @ApiOperation({
    summary: 'Add symbol to trader watchlist',
    description:
      'Historia NEX-80: asocia una accion disponible a la cuenta del trader.',
  })
  @ApiParam({ name: 'traderId', example: 'trader-123' })
  @ApiOkResponse({ type: WatchlistResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid watchlist request' })
  @ApiNotFoundResponse({ description: 'Instrument is not available' })
  @HttpCode(HttpStatus.OK)
  addSymbol(
    @Param('traderId') traderId: string,
    @Body() dto: AddWatchlistItemDto,
  ): Promise<WatchlistResponseDto> {
    return this.watchlistsService.addSymbol(traderId, dto.symbol);
  }

  @Delete(':traderId/items/:symbol')
  @ApiOperation({
    summary: 'Remove symbol from trader watchlist',
    description:
      'Historia NEX-80: retira una accion de la watchlist del trader cuando confirma la accion.',
  })
  @ApiParam({ name: 'traderId', example: 'trader-123' })
  @ApiParam({ name: 'symbol', example: 'AAPL' })
  @ApiOkResponse({ type: WatchlistResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid watchlist request' })
  removeSymbol(
    @Param('traderId') traderId: string,
    @Param('symbol') symbol: string,
  ): Promise<WatchlistResponseDto> {
    return this.watchlistsService.removeSymbol(traderId, symbol);
  }
}
