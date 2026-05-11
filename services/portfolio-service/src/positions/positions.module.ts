import { Module } from '@nestjs/common';
import { PortfolioPositionsRepository } from './repositories/portfolio-positions.repository';

@Module({
  providers: [PortfolioPositionsRepository],
  exports: [PortfolioPositionsRepository],
})
export class PositionsModule {}
