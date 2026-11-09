import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/rideops';

// Client for queries
export const client = postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 10 : 2,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Suppress notices
});

export const db = drizzle(client, { schema });

/**
 * Health check function to verify PostgreSQL database connectivity
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  timestamp?: string;
  error?: string;
}> {
  try {
    const result = await client`SELECT NOW() as current_time, current_database() as db_name`;
    return {
      connected: true,
      timestamp: result[0]?.current_time?.toString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return {
      connected: false,
      error: message,
    };
  }
}

