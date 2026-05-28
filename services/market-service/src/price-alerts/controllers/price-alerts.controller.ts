import {
  Body,
  Controller,
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
import { CreatePriceAlertDto } from '../dto/create-price-alert.dto';
import { EvaluatePriceAlertsResponseDto } from '../dto/evaluate-price-alerts-response.dto';
import { PriceAlertResponseDto } from '../dto/price-alert-response.dto';
import { PriceAlertsService } from '../services/price-alerts.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('price-alerts')
@Controller({
  path: 'price-alerts',
  version: '1',
})
@Roles('TRADER', 'ADMIN')
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create target price alert',
    description:
      'Historia NEX-81: registra una regla de monitoreo para una accion y precio objetivo. Trazabilidad: EC-AUD-04, EC-MOD-02, ASR-19, ASR-24.',
  })
  @ApiOkResponse({ type: PriceAlertResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid price alert request' })
  @ApiNotFoundResponse({ description: 'Instrument is not available' })
  @HttpCode(HttpStatus.OK)
  createAlert(
    @Body() dto: CreatePriceAlertDto,
  ): Promise<PriceAlertResponseDto> {
    return this.priceAlertsService.createAlert(dto);
  }

  @Post('evaluate')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Evaluate active target price alerts',
    description:
      'Historia NEX-81: evalua reglas activas contra la cotizacion actual y registra eventos cuando se cumple el precio objetivo.',
  })
  @ApiOkResponse({ type: EvaluatePriceAlertsResponseDto })
  @HttpCode(HttpStatus.OK)
  evaluateAlerts(): Promise<EvaluatePriceAlertsResponseDto> {
    return this.priceAlertsService.evaluateAlerts();
  }

  @Get(':traderId')
  @ApiOperation({
    summary: 'Get trader target price alerts',
    description:
      'Historia NEX-81: permite consultar las reglas de monitoreo configuradas por trader.',
  })
  @ApiParam({ name: 'traderId', example: 'trader-123' })
  @ApiOkResponse({ type: [PriceAlertResponseDto] })
  @ApiBadRequestResponse({ description: 'Invalid trader id' })
  getAlertsByTrader(
    @Param('traderId') traderId: string,
  ): Promise<PriceAlertResponseDto[]> {
    return this.priceAlertsService.getAlertsByTrader(traderId);
  }
}
