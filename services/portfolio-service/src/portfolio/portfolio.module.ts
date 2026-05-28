import { Module } from '@nestjs/common';
import { PositionsModule } from '../positions/positions.module';
import { ValuationsModule } from '../valuations/valuations.module';
import { WalletsModule } from '../wallets/wallets.module';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioService } from './services/portfolio.service';

@Module({
  imports: [PositionsModule, ValuationsModule, WalletsModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
