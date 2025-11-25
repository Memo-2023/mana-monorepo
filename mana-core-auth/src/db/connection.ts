import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let connection: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getConnection(databaseUrl: string) {
  if (!connection) {
    connection = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return connection;
}

export function getDb(databaseUrl: string) {
  if (!db) {
    const conn = getConnection(databaseUrl);
    db = drizzle(conn, { schema });
  }
  return db;
}

export async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
    db = null;
  }
}
