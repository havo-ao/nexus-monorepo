import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

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

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: getOptionalNumber(process.env.MYSQL_PORT, 3307),
  user: requireEnv('MYSQL_USER'),
  password: requireEnv('MYSQL_PASSWORD'),
  database: requireEnv('MYSQL_DATABASE'),
});

async function migrate() {
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        service_name VARCHAR(80) NOT NULL,
        migration_name VARCHAR(160) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (service_name, migration_name)
      )
    `);

    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const migrationFile of migrationFiles) {
      const [existingRows] = await connection.query(
        `SELECT migration_name
         FROM schema_migrations
         WHERE service_name = ? AND migration_name = ?`,
        ['market-service', migrationFile],
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
        `INSERT INTO schema_migrations (service_name, migration_name)
         VALUES (?, ?)`,
        ['market-service', migrationFile],
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
    connection.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
