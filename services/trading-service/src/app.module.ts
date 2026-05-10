import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { ValidationsModule } from './validations/validations.module';

const databaseImports = process.env.NODE_ENV === 'test' ? [] : [DatabaseModule];

@Module({
  imports: [...databaseImports, ValidationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
