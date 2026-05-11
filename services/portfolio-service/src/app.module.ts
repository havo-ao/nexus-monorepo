import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppController } from './app.controller';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [DatabaseModule, PortfolioModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
