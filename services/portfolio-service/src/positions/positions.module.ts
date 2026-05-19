import { Module } from '@nestjs/common';
import { PortfolioPositionsRepository } from './repositories/portfolio-positions.repository';
import { PositionsService } from './services/positions.service';

@Module({
  providers: [PortfolioPositionsRepository, PositionsService],
  exports: [PortfolioPositionsRepository, PositionsService],
})
export class PositionsModule {}
