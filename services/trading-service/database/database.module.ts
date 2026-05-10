import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundsValidationEvent } from '../src/validations/entities/funds-validation-event.entity';
import { Wallet } from '../src/wallet/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3307),
      username: process.env.DB_USERNAME ?? 'nexus_user',
      password: process.env.DB_PASSWORD ?? 'nexus_password',
      database: process.env.DB_DATABASE ?? 'nexus',
      entities: [FundsValidationEvent, Wallet],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
