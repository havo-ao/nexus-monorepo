import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigureMarketHoursDto } from '../dto/configure-market-hours.dto';
import { ConfigureMarketRestrictionDto } from '../dto/configure-market-restriction.dto';
import { MarketHoursConfigurationResponseDto } from '../dto/market-hours-configuration-response.dto';
import { MarketHoursAdminService } from '../services/market-hours-admin.service';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('market-hours-admin')
@Controller({
  path: 'admin/market-hours',
  version: '1',
})
@Roles('ADMIN')
export class MarketHoursAdminController {
  constructor(
    private readonly marketHoursAdminService: MarketHoursAdminService,
  ) {}

  @Get(':marketCode')
  @ApiOperation({
    summary: 'Get market operating hours configuration',
    description:
      'Subtarea NEX-100: permite al panel administrativo cargar la configuracion operativa actual antes de editar horarios o restricciones.',
  })
  @ApiOkResponse({ type: MarketHoursConfigurationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid market code' })
  getConfiguration(
    @Param('marketCode') marketCode: string,
  ): Promise<MarketHoursConfigurationResponseDto> {
    return this.marketHoursAdminService.getConfiguration(marketCode);
  }

  @Put(':marketCode')
  @ApiOperation({
    summary: 'Configure market operating hours',
    description:
      'Historia NEX-83: permite a un administrador actualizar la configuracion operativa de un mercado. Trazabilidad: EC-DISP-08, EC-AUD-06, ASR-19, ASR-24.',
  })
  @ApiBody({ type: ConfigureMarketHoursDto })
  @ApiOkResponse({ type: MarketHoursConfigurationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid market-hours configuration' })
  configureSchedule(
    @Param('marketCode') marketCode: string,
    @Body() dto: ConfigureMarketHoursDto,
  ): Promise<MarketHoursConfigurationResponseDto> {
    return this.marketHoursAdminService.configureSchedule(marketCode, dto);
  }

  @Post(':marketCode/restrictions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Configure market restriction or closing day',
    description:
      'Historia NEX-83: permite configurar cierres o restricciones operativas por mercado y fecha.',
  })
  @ApiBody({ type: ConfigureMarketRestrictionDto })
  @ApiOkResponse({ type: MarketHoursConfigurationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid restriction configuration' })
  configureRestriction(
    @Param('marketCode') marketCode: string,
    @Body() dto: ConfigureMarketRestrictionDto,
  ): Promise<MarketHoursConfigurationResponseDto> {
    return this.marketHoursAdminService.configureRestriction(marketCode, dto);
  }
}
