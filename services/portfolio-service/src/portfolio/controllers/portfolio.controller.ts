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
import { RecordExecutedSellDto } from '../../positions/dto/record-executed-sell.dto';
import { RecordDepositDto } from '../../wallets/dto/record-deposit.dto';
import { WalletBalanceResponseDto } from '../../wallets/dto/wallet-balance-response.dto';
import { WalletDepositResponseDto } from '../../wallets/dto/wallet-deposit-response.dto';
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

  @Get(':traderId/balance')
  @ApiOperation({
    summary: 'NEX-66 Consultar saldo disponible',
  })
  @ApiOkResponse({ type: WalletBalanceResponseDto })
  getAvailableBalance(
    @Param('traderId', ParseIntPipe) traderId: number,
  ): Promise<WalletBalanceResponseDto> {
    return this.portfolioService.getAvailableBalance(String(traderId));
  }

  @Post(':traderId/deposits')
  @ApiOperation({
    summary: 'NEX-67 Depositar fondos',
  })
  @ApiCreatedResponse({ type: WalletDepositResponseDto })
  recordDeposit(
    @Param('traderId', ParseIntPipe) traderId: number,
    @Body() dto: RecordDepositDto,
  ): Promise<WalletDepositResponseDto> {
    return this.portfolioService.recordDeposit(String(traderId), dto);
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

  @Post('positions/sales')
  @ApiOperation({
    summary: 'NEX-65 Actualizar holdings tras venta ejecutada',
  })
  @ApiCreatedResponse({ type: PortfolioPositionResponseDto })
  recordExecutedSell(
    @Body() dto: RecordExecutedSellDto,
  ): Promise<PortfolioPositionResponseDto> {
    return this.portfolioService.recordExecutedSell(dto);
  }
}
