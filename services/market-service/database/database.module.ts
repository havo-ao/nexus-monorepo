import { Module } from '@nestjs/common';
import { createPool, Pool, PoolOptions } from 'mysql2/promise';

export const MYSQL_POOL = Symbol('MYSQL_POOL');

function getOptionalNumber(value: string | undefined, fallback: number): number {
  return value ? Number(value) : fallback;
}

function getDatabasePoolOptions(): PoolOptions {
  return {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: getOptionalNumber(process.env.MYSQL_PORT, 3307),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
  };
}

@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      useFactory: (): Pool => createPool(getDatabasePoolOptions()),
    },
  ],
  exports: [MYSQL_POOL],
})
export class DatabaseModule {}
