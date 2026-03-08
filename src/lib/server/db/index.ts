import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { serverConfig } from '$lib/server/config';
import * as schema from '$lib/server/db/schema';

const createDatabase = (connectionString: string) => {
  const client = postgres(connectionString, {
    max: 1,
    prepare: false
  });

  return drizzle(client, { schema });
};

export type Database = ReturnType<typeof createDatabase>;

let database: Database | null = null;

export const isDatabaseConfigured = () => Boolean(serverConfig.DATABASE_URL);

export const getDb = () => {
  if (!serverConfig.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  database ??= createDatabase(serverConfig.DATABASE_URL);

  return database;
};

export { schema };
