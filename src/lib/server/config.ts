import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export type StorageDriver = 'local' | 's3';

const storageDriver = (privateEnv.STORAGE_DRIVER || 'local') as StorageDriver;

export const serverConfig = {
  DATABASE_URL: privateEnv.DATABASE_URL || '',
  STORAGE_DRIVER: storageDriver,
  STORAGE_BASE_PATH: privateEnv.STORAGE_BASE_PATH || './data',
  VERTEX_PROJECT_ID: privateEnv.VERTEX_PROJECT_ID || '',
  VERTEX_LOCATION: privateEnv.VERTEX_LOCATION || '',
  VERTEX_MODEL: privateEnv.VERTEX_MODEL || '',
  GOOGLE_APPLICATION_CREDENTIALS: privateEnv.GOOGLE_APPLICATION_CREDENTIALS || '',
  PUBLIC_APP_NAME: publicEnv.PUBLIC_APP_NAME || 'Moebel Visualisierung'
} as const;

export const isStorageDriver = (value: string): value is StorageDriver =>
  value === 'local' || value === 's3';
