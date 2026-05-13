import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { FundsValidationModule } from './funds-validation/funds-validation.module';
import { MarketValidationModule } from './market-validation/market-validation.module';

const databaseImports = process.env.NODE_ENV === 'test' ? [] : [DatabaseModule];

@Module({
  imports: [...databaseImports, FundsValidationModule, MarketValidationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
