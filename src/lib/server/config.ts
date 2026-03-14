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
  GEMINI_API_KEY: privateEnv.GEMINI_API_KEY || '',
  BFL_API_KEY: privateEnv.BFL_API_KEY || '',
  PUBLIC_APP_NAME: publicEnv.PUBLIC_APP_NAME || 'Moebel Visualisierung'
} as const;

export const getVertexRuntimeConfig = () => ({
  projectId: serverConfig.VERTEX_PROJECT_ID,
  location: serverConfig.VERTEX_LOCATION,
  model: serverConfig.VERTEX_MODEL,
  credentialsPath: serverConfig.GOOGLE_APPLICATION_CREDENTIALS,
  configured: Boolean(
    serverConfig.VERTEX_PROJECT_ID && serverConfig.VERTEX_LOCATION && serverConfig.VERTEX_MODEL
  )
});

export const isStorageDriver = (value: string): value is StorageDriver =>
  value === 'local' || value === 's3';
