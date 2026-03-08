import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { serverConfig } from '$lib/server/config';
import type {
  Base64DebugSummary,
  BinaryAssetDebug,
  ProviderArtifactDebug
} from '$lib/types/generation';

const DEBUG_RUN_ROOT = path.resolve(serverConfig.STORAGE_BASE_PATH, '_debug', 'vertex-runs');
const BASE64_PREVIEW_LENGTH = 24;
const RAW_RESPONSE_PREVIEW_LIMIT = 4000;

const normalizeBytes = (bytes: Uint8Array) => Buffer.from(bytes);

export const createDebugRunId = () => crypto.randomUUID();

export const sha256Hex = (bytes: Uint8Array) =>
  createHash('sha256').update(normalizeBytes(bytes)).digest('hex');

export const summarizeBase64 = (value: string | null | undefined): Base64DebugSummary | null => {
  if (!value) {
    return null;
  }

  const hasDataUrlPrefix = value.startsWith('data:');
  const payload = hasDataUrlPrefix ? value.slice(value.indexOf(',') + 1) : value;

  return {
    length: payload.length,
    prefix: payload.slice(0, BASE64_PREVIEW_LENGTH) || null,
    suffix: payload.slice(-BASE64_PREVIEW_LENGTH) || null,
    hasDataUrlPrefix
  };
};

export const summarizeBinaryAsset = (input: {
  label: string;
  bytes: Uint8Array | null;
  mimeType?: string | null;
  base64?: string | null;
}): BinaryAssetDebug => {
  if (!input.bytes) {
    return {
      label: input.label,
      mimeType: input.mimeType ?? null,
      byteLength: null,
      base64: input.base64 ? summarizeBase64(input.base64) : null,
      sha256: null
    };
  }

  const base64 = input.base64 ?? Buffer.from(input.bytes).toString('base64');

  return {
    label: input.label,
    mimeType: input.mimeType ?? null,
    byteLength: input.bytes.byteLength,
    base64: summarizeBase64(base64),
    sha256: sha256Hex(input.bytes)
  };
};

export const sanitizeProviderPayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeProviderPayload(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const next: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string' && key === 'bytesBase64Encoded') {
      next[key] = summarizeBase64(entry);
      continue;
    }

    next[key] = sanitizeProviderPayload(entry);
  }

  return next;
};

export const previewRawResponse = (value: string) => {
  if (!value) {
    return null;
  }

  if (value.length <= RAW_RESPONSE_PREVIEW_LIMIT) {
    return value;
  }

  return `${value.slice(0, RAW_RESPONSE_PREVIEW_LIMIT)}\n...[truncated ${value.length - RAW_RESPONSE_PREVIEW_LIMIT} chars]`;
};

const getRunDirectory = (runId: string) => path.join(DEBUG_RUN_ROOT, runId);

const toRelativeArtifactPath = (absolutePath: string) =>
  path.relative(serverConfig.STORAGE_BASE_PATH, absolutePath);

export const createVertexDebugLogger = (runId: string, enabled: boolean) => {
  const log = (stage: string, payload: unknown) => {
    const message = JSON.stringify(payload, null, 2);
    console.info(`[vertex-debug][${runId}][${stage}] ${message}`);
  };

  const ensureDirectory = async () => {
    if (!enabled) {
      return null;
    }

    const runDirectory = getRunDirectory(runId);
    await mkdir(runDirectory, { recursive: true });
    return runDirectory;
  };

  const writeJson = async (name: string, payload: unknown) => {
    const runDirectory = await ensureDirectory();

    if (!runDirectory) {
      return null;
    }

    const absolutePath = path.join(runDirectory, `${name}.json`);
    await writeFile(absolutePath, JSON.stringify(payload, null, 2), 'utf8');

    return toRelativeArtifactPath(absolutePath);
  };

  const writeText = async (name: string, content: string) => {
    const runDirectory = await ensureDirectory();

    if (!runDirectory) {
      return null;
    }

    const absolutePath = path.join(runDirectory, `${name}.txt`);
    await writeFile(absolutePath, content, 'utf8');

    return toRelativeArtifactPath(absolutePath);
  };

  const writeBinary = async (name: string, extension: string, bytes: Uint8Array) => {
    const runDirectory = await ensureDirectory();

    if (!runDirectory) {
      return null;
    }

    const absolutePath = path.join(runDirectory, `${name}.${extension}`);
    await writeFile(absolutePath, normalizeBytes(bytes));

    return absolutePath;
  };

  const writeBinaryArtifact = async (input: {
    name: string;
    extension: string;
    label: string;
    bytes: Uint8Array;
    mimeType?: string | null;
  }): Promise<ProviderArtifactDebug | null> => {
    const absolutePath = await writeBinary(input.name, input.extension, input.bytes);

    if (!absolutePath) {
      return null;
    }

    return {
      label: input.label,
      relativePath: toRelativeArtifactPath(absolutePath),
      mimeType: input.mimeType ?? null,
      byteLength: input.bytes.byteLength,
      sha256: sha256Hex(input.bytes)
    };
  };

  return {
    log,
    writeJson,
    writeText,
    writeBinaryArtifact
  };
};
