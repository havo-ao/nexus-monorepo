import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

const isDatabaseDisabled = process.env.NEXUS_DISABLE_DB === 'true';

if (!isDatabaseDisabled && !process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD environment variable is required');
}

@Module({
  imports: isDatabaseDisabled
    ? []
    : [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST ?? 'mysql',
          port: Number(process.env.DB_PORT ?? 3306),
          username: process.env.DB_USERNAME ?? 'nexus_user',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE ?? 'nexus',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
          synchronize: false,
          autoLoadEntities: true,
        }),
      ],
})
export class DatabaseModule {}
