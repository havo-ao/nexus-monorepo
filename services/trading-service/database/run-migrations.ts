import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import mysql from 'mysql2/promise';

const migrationsDirectory = join(__dirname, 'migrations');
const maxConnectionAttempts = 30;
const retryDelayMs = 1000;

async function runMigrations() {
  const connection = await connectWithRetry();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const migrationFile of migrationFiles) {
      const migrationId = basename(migrationFile);
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        'SELECT id FROM schema_migrations WHERE id = ? LIMIT 1',
        [migrationId],
      );

      if (rows.length > 0) {
        console.log(`Skipping already applied migration ${migrationId}`);
        continue;
      }

      console.log(`Applying migration ${migrationId}`);
      const sql = await readFile(
        join(migrationsDirectory, migrationFile),
        'utf8',
      );
      await connection.beginTransaction();
      try {
        for (const statement of splitSqlStatements(sql)) {
          try {
            await connection.query(statement);
          } catch (error) {
            if (!isIgnorableMigrationError(error)) {
              throw error;
            }
            console.log(
              `Skipping already present schema change in ${migrationId}`,
            );
          }
        }
        await connection.query(
          'INSERT INTO schema_migrations (id) VALUES (?)',
          [migrationId],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }
}

async function connectWithRetry(): Promise<mysql.Connection> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxConnectionAttempts; attempt += 1) {
    try {
      return await mysql.createConnection({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3307),
        user: process.env.DB_USERNAME ?? 'nexus_user',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_DATABASE ?? 'nexus',
      });
    } catch (error) {
      lastError = error;
      console.log(
        `Waiting for database connection (${attempt}/${maxConnectionAttempts})`,
      );
      await delay(retryDelayMs);
    }
  }

  throw lastError;
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith('--'));
}

function isIgnorableMigrationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errno' in error &&
    error.errno === 1060
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void runMigrations();
