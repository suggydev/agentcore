import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get database connection instance
 * @throws {Error} if DATABASE_URL is not set
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!pool) {
    pool = new Pool(poolConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  if (!db) {
    db = drizzle(pool, { schema });
  }

  return db;
}

/**
 * Check database health with timeout
 * @returns true if database is accessible
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const database = getDb();
    const result = await database.execute({ sql: 'SELECT 1' });
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close database connections gracefully
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export type Database = ReturnType<typeof getDb>;
