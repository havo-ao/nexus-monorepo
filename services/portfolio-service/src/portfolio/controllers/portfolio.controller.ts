import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
