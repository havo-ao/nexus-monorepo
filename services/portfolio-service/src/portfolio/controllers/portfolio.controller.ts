import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RecordExecutedBuyDto } from '../../positions/dto/record-executed-buy.dto';
import { PortfolioPositionResponseDto } from '../dto/portfolio-position-response.dto';
import { PortfolioSectorDistributionResponseDto } from '../dto/portfolio-sector-distribution-response.dto';
import { PortfolioSummaryResponseDto } from '../dto/portfolio-summary-response.dto';
import { PortfolioService } from '../services/portfolio.service';

@ApiTags('portfolio')
@Controller({ path: 'portfolio', version: '1' })
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':traderId')
  @ApiOperation({
    summary: 'NEX-58 Consultar portafolio consolidado de un trader',
  })
  @ApiOkResponse({ type: PortfolioSummaryResponseDto })
  getConsolidatedPortfolio(
    @Param('traderId', ParseIntPipe) traderId: number,
  ): Promise<PortfolioSummaryResponseDto> {
    return this.portfolioService.getConsolidatedPortfolio(String(traderId));
  }

  @Get(':traderId/distribution/sectors')
  @ApiOperation({
    summary: 'NEX-63 Visualizar distribucion del portafolio por sector',
  })
  @ApiOkResponse({ type: PortfolioSectorDistributionResponseDto })
  getSectorDistribution(
    @Param('traderId', ParseIntPipe) traderId: number,
  ): Promise<PortfolioSectorDistributionResponseDto> {
    return this.portfolioService.getSectorDistribution(String(traderId));
  }

  @Get(':traderId/positions/:positionId')
  @ApiOperation({
    summary: 'NEX-59 Consultar detalle de una posicion del portafolio',
  })
  @ApiOkResponse({ type: PortfolioPositionResponseDto })
  getPositionDetail(
    @Param('traderId', ParseIntPipe) traderId: number,
    @Param('positionId', ParseIntPipe) positionId: number,
  ): Promise<PortfolioPositionResponseDto> {
    return this.portfolioService.getPositionDetail(
      String(traderId),
      String(positionId),
    );
  }

  @Post('positions/purchases')
  @ApiOperation({
    summary: 'NEX-64 Actualizar holdings tras compra ejecutada',
  })
  @ApiCreatedResponse({ type: PortfolioPositionResponseDto })
  recordExecutedBuy(
    @Body() dto: RecordExecutedBuyDto,
  ): Promise<PortfolioPositionResponseDto> {
    return this.portfolioService.recordExecutedBuy(dto);
  }
}
