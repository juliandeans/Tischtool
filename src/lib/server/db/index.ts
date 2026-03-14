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

type DatabaseError = Error & {
  cause?: unknown;
  code?: string;
  errors?: unknown[];
};

let database: Database | null = null;
const loggedFallbackWarnings = new Set<string>();
const databaseConnectionErrorCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ETIMEDOUT'
]);

const flattenDatabaseErrors = (error: unknown): DatabaseError[] => {
  if (!(error instanceof Error)) {
    return [];
  }

  const databaseError = error as DatabaseError;
  const nestedErrors =
    error instanceof AggregateError
      ? error.errors.flatMap((nestedError) => flattenDatabaseErrors(nestedError))
      : [];
  const causeErrors = databaseError.cause ? flattenDatabaseErrors(databaseError.cause) : [];

  return [databaseError, ...nestedErrors, ...causeErrors];
};

const isDatabaseConnectionError = (error: unknown) =>
  flattenDatabaseErrors(error).some((databaseError) => {
    if (databaseError.code && databaseConnectionErrorCodes.has(databaseError.code)) {
      return true;
    }

    return /(ECONNREFUSED|ECONNRESET|EAI_AGAIN|ENOTFOUND|ETIMEDOUT)/i.test(
      databaseError.message
    );
  });

const logFallbackWarning = (context: string, error: unknown) => {
  const details =
    flattenDatabaseErrors(error)
      .map((databaseError) => databaseError.message.trim())
      .filter(Boolean)
      .join(' | ') || 'unknown database error';
  const key = `${context}:${details}`;

  if (loggedFallbackWarnings.has(key)) {
    return;
  }

  loggedFallbackWarnings.add(key);
  console.warn(`[db] ${context}: database unavailable, using fallback data. ${details}`);
};

export const isDatabaseConfigured = () => Boolean(serverConfig.DATABASE_URL);

export const getDb = () => {
  if (!serverConfig.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  database ??= createDatabase(serverConfig.DATABASE_URL);

  return database;
};

export const runDatabaseRead = async <T>(
  context: string,
  fallback: T,
  query: (db: Database) => Promise<T>
) => {
  if (!isDatabaseConfigured()) {
    return fallback;
  }

  try {
    return await query(getDb());
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      logFallbackWarning(context, error);
      return fallback;
    }

    throw error;
  }
};

export { schema };
