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
      .sort((left, right) => left.localeCompare(right));

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
          await executeMigrationStatement(connection, statement);
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

async function executeMigrationStatement(
  connection: mysql.Connection,
  statement: string,
): Promise<void> {
  const addColumnIfMissing =
    /^ALTER\s+TABLE\s+`?(\w+)`?\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+`?(\w+)`?\s+([\s\S]+)$/i.exec(
      statement,
    );

  if (!addColumnIfMissing) {
    await connection.query(statement);
    return;
  }

  const [, tableName, columnName, columnDefinition] = addColumnIfMissing;
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [process.env.DB_DATABASE ?? 'nexus', tableName, columnName],
  );

  if (rows.length > 0) {
    return;
  }

  await connection.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`,
  );
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith('--'));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void runMigrations();
