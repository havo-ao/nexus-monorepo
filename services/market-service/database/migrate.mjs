import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');
const migrationsTable = 'market_schema_migrations';
const maxConnectionAttempts = 30;
const retryDelayMs = 1000;

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to run market-service migrations`);
  }

  return value;
}

function getOptionalNumber(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error('MYSQL_PORT must be a positive integer');
  }

  return parsedValue;
}

async function migrate() {
  const connection = await connectWithRetry();
  let transactionStarted = false;

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ${migrationsTable} (
        id VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);
    await copyLegacyMigrationRecords(connection);

    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const migrationFile of migrationFiles) {
      const migrationId = migrationFile;
      const [existingRows] = await connection.query(
        `SELECT id
         FROM ${migrationsTable}
         WHERE id = ?
         LIMIT 1`,
        [migrationId],
      );

      if (existingRows.length > 0) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, migrationFile), 'utf8');
      const statements = sql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

      await connection.beginTransaction();
      transactionStarted = true;

      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query(
        `INSERT INTO ${migrationsTable} (id)
         VALUES (?)`,
        [migrationId],
      );
      await connection.commit();
      transactionStarted = false;

      console.log(`Applied migration ${migrationFile}`);
    }
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    await connection.end();
  }
}

async function copyLegacyMigrationRecords(connection) {
  try {
    await connection.query(`
      INSERT IGNORE INTO ${migrationsTable} (id, applied_at)
      SELECT REPLACE(id, 'market-service/', ''), applied_at
      FROM schema_migrations
      WHERE id LIKE 'market-service/%'
    `);
  } catch (error) {
    if (!isMissingLegacyMigrationTable(error)) {
      throw error;
    }
  }
}

async function connectWithRetry() {
  let lastError;

  for (let attempt = 1; attempt <= maxConnectionAttempts; attempt += 1) {
    try {
      return await mysql.createConnection({
        host: process.env.MYSQL_HOST ?? 'localhost',
        port: getOptionalNumber(process.env.MYSQL_PORT, 3307),
        user: requireEnv('MYSQL_USER'),
        password: requireEnv('MYSQL_PASSWORD'),
        database: requireEnv('MYSQL_DATABASE'),
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMissingLegacyMigrationTable(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR')
  );
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
