import { Module } from '@nestjs/common';
import { createPool, Pool } from 'mysql2/promise';

export const MYSQL_POOL = Symbol('MYSQL_POOL');

@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      useFactory: (): Pool =>
        createPool({
          host: process.env.MYSQL_HOST ?? 'localhost',
          port: Number(process.env.MYSQL_PORT ?? 3307),
          user: process.env.MYSQL_USER ?? 'nexus_user',
          password: process.env.MYSQL_PASSWORD ?? 'nexus_password',
          database: process.env.MYSQL_DATABASE ?? 'nexus',
          waitForConnections: true,
          connectionLimit: 5,
        }),
    },
  ],
  exports: [MYSQL_POOL],
})
export class DatabaseModule {}
