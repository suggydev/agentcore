import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.fatal('DATABASE_URL environment variable is required');
  throw new Error('DATABASE_URL environment variable is required');
}

const DB_POOL_MAX = Number(process.env.DB_POOL_MAX) || 20;
const DB_POOL_IDLE_TIMEOUT_MS = Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 30_000;
const DB_POOL_CONNECTION_TIMEOUT_MS = Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS) || 10_000;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: DB_POOL_MAX,
  idleTimeoutMillis: DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DB_POOL_CONNECTION_TIMEOUT_MS,
});

// Log pool errors so they don't go silent
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', {
    errorMessage: err.message,
    errorName: err.name,
  });
});

pool.on('connect', () => {
  logger.debug('New database client connected to pool');
});

pool.on('remove', () => {
  logger.debug('Database client removed from pool');
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

logger.info('Database connection pool initialized', {
  maxPoolSize: DB_POOL_MAX,
  idleTimeoutMs: DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMs: DB_POOL_CONNECTION_TIMEOUT_MS,
});
