import type {
  CreateGenerationInput,
  GenerationMode,
  GenerationRuntimeOptions
} from '$lib/types/generation';

import { vertexClient } from '$lib/server/vertex/client';

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

const clampSampleCount = (variantsRequested: number) =>
  Math.max(1, Math.min(4, Math.round(variantsRequested)));

export type VertexExecutionPlan = {
  useVertex: boolean;
  reason: string | null;
  configured: boolean;
  provider: 'vertex' | 'dev-fake';
  model: string;
};

export type VertexGeneratedImage = {
  bytes: Uint8Array;
  mimeType: string;
};

export type VertexGenerationResult = {
  provider: 'vertex';
  model: string;
  usage: Record<string, unknown>;
  images: VertexGeneratedImage[];
};

export class VertexProviderError extends Error {
  status: number | null;
  details: unknown;

  constructor(message: string, options?: { status?: number | null; details?: unknown }) {
    super(message);
    this.name = 'VertexProviderError';
    this.status = options?.status ?? null;
    this.details = options?.details ?? null;
  }
}

export const buildEnvironmentEditVertexPayload = (
  input: CreateGenerationInput,
  promptText: string,
  sourceImageBase64: string
) => ({
  instances: [
    {
      prompt: promptText,
      referenceImages: [
        {
          referenceType: 'REFERENCE_TYPE_RAW',
          referenceId: 1,
          referenceImage: {
            bytesBase64Encoded: sourceImageBase64
          }
        }
      ]
    }
  ],
  parameters: {
    sampleCount: clampSampleCount(input.variantsRequested)
  }
});

export const parseVertexImageResponse = (payload: unknown): VertexGeneratedImage[] => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { predictions?: unknown }).predictions)
  ) {
    throw new VertexProviderError('Vertex response does not contain predictions.', {
      details: payload
    });
  }

  const predictions = (payload as { predictions: Array<Record<string, unknown>> }).predictions;
  const images: VertexGeneratedImage[] = [];

  for (const prediction of predictions) {
    const bytesBase64Encoded =
      typeof prediction.bytesBase64Encoded === 'string' ? prediction.bytesBase64Encoded : null;

    if (!bytesBase64Encoded) {
      continue;
    }

    images.push({
      bytes: Uint8Array.from(Buffer.from(bytesBase64Encoded, 'base64')),
      mimeType:
        typeof prediction.mimeType === 'string' && prediction.mimeType
          ? prediction.mimeType
          : 'image/png'
    });
  }

  if (!images.length) {
    throw new VertexProviderError('Vertex response did not return any images.', {
      details: payload
    });
  }

  return images;
};

export class VertexImageService {
  getExecutionPlan(
    mode: GenerationMode,
    variantsRequested: number,
    runtimeOptions?: GenerationRuntimeOptions
  ): VertexExecutionPlan {
    const configuration = vertexClient.getConfiguration();
    const providerPreference = runtimeOptions?.providerPreference ?? 'real';

    if (providerPreference === 'fake') {
      return {
        useVertex: false,
        reason: 'Fake-Flow ist in den Settings bevorzugt.',
        configured: configuration.configured,
        provider: 'dev-fake',
        model: `${mode}-fake`
      };
    }

    if (mode !== 'environment_edit') {
      return {
        useVertex: false,
        reason: 'Only environment_edit uses the real Vertex flow in this step.',
        configured: configuration.configured,
        provider: 'dev-fake',
        model: `${mode}-fake`
      };
    }

    if (!configuration.configured) {
      return {
        useVertex: false,
        reason: 'Vertex environment variables are incomplete.',
        configured: false,
        provider: 'dev-fake',
        model: configuration.model || 'environment_edit-fake'
      };
    }

    if (clampSampleCount(variantsRequested) !== Math.round(variantsRequested)) {
      return {
        useVertex: false,
        reason: 'Vertex sampleCount is limited to 1-4 variants in this MVP flow.',
        configured: true,
        provider: 'dev-fake',
        model: 'environment_edit-fake'
      };
    }

    return {
      useVertex: true,
      reason: null,
      configured: true,
      provider: 'vertex',
      model: configuration.model
    };
  }

  prepareRequest(
    input: CreateGenerationInput,
    promptText: string,
    runtimeOptions?: GenerationRuntimeOptions
  ) {
    const plan = this.getExecutionPlan(input.mode, input.variantsRequested, runtimeOptions);
    const configuration = vertexClient.getConfiguration();

    if (input.mode === 'environment_edit') {
      return {
        provider: 'vertex',
        configured: configuration.configured,
        model: configuration.model || 'unconfigured',
        payload: buildEnvironmentEditVertexPayload(input, promptText, '<omitted-base64-image>')
      };
    }

    return {
      provider: plan.provider,
      configured: configuration.configured,
      model: plan.model || 'unconfigured',
      payload: {
        mode: input.mode,
        promptText,
        variantsRequested: input.variantsRequested
      }
    };
  }

  async generateEnvironmentEdit(
    input: CreateGenerationInput,
    promptText: string,
    sourceImageBytes: Uint8Array
  ) {
    const configuration = vertexClient.getConfiguration();

    if (!configuration.configured) {
      throw new VertexProviderError('Vertex configuration is incomplete.');
    }

    const payload = buildEnvironmentEditVertexPayload(
      input,
      promptText,
      toBase64(sourceImageBytes)
    );
    const accessToken = await vertexClient.getAccessToken();
    const response = await fetch(vertexClient.getPredictUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const rawResponse = await response.text();
    let parsedResponse: unknown = rawResponse;

    if (rawResponse) {
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch {
        parsedResponse = rawResponse;
      }
    }

    if (!response.ok) {
      throw new VertexProviderError(`Vertex request failed with status ${response.status}.`, {
        status: response.status,
        details: parsedResponse
      });
    }

    const images = parseVertexImageResponse(parsedResponse);

    return {
      provider: 'vertex' as const,
      model: configuration.model,
      usage: {
        fakeGeneration: false,
        sampleCount: clampSampleCount(input.variantsRequested),
        rawPredictionCount: Array.isArray((parsedResponse as { predictions?: unknown }).predictions)
          ? (parsedResponse as { predictions: unknown[] }).predictions.length
          : images.length
      },
      images
    } satisfies VertexGenerationResult;
  }
}

export const vertexImageService = new VertexImageService();
