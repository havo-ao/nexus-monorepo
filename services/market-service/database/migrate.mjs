import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORT ?? 3307),
  user: process.env.MYSQL_USER ?? 'nexus_user',
  password: process.env.MYSQL_PASSWORD ?? 'nexus_password',
  database: process.env.MYSQL_DATABASE ?? 'nexus',
  multipleStatements: true,
});

async function migrate() {
  const connection = await pool.getConnection();

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

      await connection.beginTransaction();
      await connection.query(sql);
      await connection.query(
        `INSERT INTO schema_migrations (service_name, migration_name)
         VALUES (?, ?)`,
        ['market-service', migrationFile],
      );
      await connection.commit();

      console.log(`Applied migration ${migrationFile}`);
    }
  } catch (error) {
    await connection.rollback();
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
