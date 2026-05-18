import { Module } from '@nestjs/common';
import { PositionsModule } from '../positions/positions.module';
import { ValuationsModule } from '../valuations/valuations.module';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioService } from './services/portfolio.service';

@Module({
  imports: [PositionsModule, ValuationsModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
