import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioPositionResponseDto } from '../dto/portfolio-position-response.dto';
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
}
