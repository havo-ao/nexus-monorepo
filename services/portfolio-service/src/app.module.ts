import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [DatabaseModule, PortfolioModule],
  controllers: [AppController],
  providers: [JwtAuthGuard],
})
export class AppModule {}
