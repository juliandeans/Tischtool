import sharp from 'sharp';

import type {
  BinaryAssetDebug,
  CreateGenerationInput,
  GenerationMode,
  GenerationRuntimeOptions,
  ProviderArtifactDebug,
  ProviderDebugRequest,
  ProviderDebugRun,
  ProviderPredictionDebug,
  ProviderRequestType
} from '$lib/types/generation';

import { vertexClient } from '$lib/server/vertex/client';
import {
  createVertexDebugLogger,
  previewRawResponse,
  sanitizeProviderPayload,
  summarizeBase64,
  summarizeBinaryAsset
} from '$lib/server/vertex/debug';

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

const clampSampleCount = (variantsRequested: number) =>
  Math.max(1, Math.min(4, Math.round(variantsRequested)));

const ENVIRONMENT_EDIT_MODE = 'EDIT_MODE_BGSWAP';
const ENVIRONMENT_MASK_MODE = 'MASK_MODE_BACKGROUND';
const BORDER_SAMPLE_SIZE = 16;
const BACKGROUND_DISTANCE_THRESHOLD = 54;

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
  providerDebug: ProviderDebugRun;
  images: VertexGeneratedImage[];
};

type PreparedVertexRequest = {
  provider: string;
  configured: boolean;
  model: string;
  payload: Record<string, unknown>;
  providerDebug: ProviderDebugRequest;
};

const getRequestType = (mode: GenerationMode): ProviderRequestType =>
  mode === 'environment_edit' || mode === 'material_edit' || mode === 'room_insert'
    ? 'edit'
    : 'generate';

const getEditStrategy = (mode: GenerationMode, plan: VertexExecutionPlan): string => {
  if (plan.provider === 'dev-fake') {
    return mode === 'room_insert'
      ? 'Fake-Komposition mit Raumfoto, Möbelbild und Zielregion.'
      : 'Fake-Flow auf Basis des Quellbilds ohne echten Provider-Request.';
  }

  if (mode === 'environment_edit') {
    return 'Imagen-Edit mit Quellbild und automatischer Hintergrundmaske (Background Swap), ohne explizite Zielregion.';
  }

  if (mode === 'room_insert') {
    return 'Raumfoto-Insert mit Zielregion, aber in dieser Phase noch kein echter Provider-Flow.';
  }

  return 'Bild-Edit ohne separaten Masken- oder Regions-Input.';
};

const getModelHint = (model: string, requestType: ProviderRequestType) => {
  const normalizedModel = model.toLowerCase();

  if (requestType !== 'edit') {
    return null;
  }

  if (normalizedModel.includes('generate')) {
    return 'Der Modellname wirkt eher wie ein Generate-Modell. Änderungen am Ausgangsbild koennen dadurch schwach ausfallen.';
  }

  if (!normalizedModel.includes('edit') && !normalizedModel.includes('capability')) {
    return 'Der Modellname signalisiert keinen expliziten Edit-Modus. Pruefe, ob dieses Modell Referenzbild-Editing sauber unterstuetzt.';
  }

  return null;
};

const getPredictionCount = (payload: unknown) =>
  payload &&
  typeof payload === 'object' &&
  Array.isArray((payload as { predictions?: unknown }).predictions)
    ? (payload as { predictions: unknown[] }).predictions.length
    : null;

const getResponseMetadata = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const metadata: Record<string, unknown> = {};

  for (const key of ['metadata', 'deployedModelId', 'modelVersionId']) {
    if (key in record) {
      metadata[key] = record[key];
    }
  }

  return Object.keys(metadata).length ? metadata : null;
};

const getResponseRootKeys = (payload: unknown) =>
  payload && typeof payload === 'object' ? Object.keys(payload as Record<string, unknown>) : [];

const normalizeImageForMask = async (sourceImageBytes: Uint8Array) =>
  sharp(sourceImageBytes).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const sampleBorderAverage = (
  data: Buffer<ArrayBufferLike>,
  width: number,
  height: number,
  channels: number
) => {
  let count = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  const maxX = width - 1;
  const maxY = height - 1;

  const visit = (x: number, y: number) => {
    const index = (y * width + x) * channels;
    red += data[index] ?? 0;
    green += data[index + 1] ?? 0;
    blue += data[index + 2] ?? 0;
    count += 1;
  };

  for (let x = 0; x < width; x += 1) {
    visit(x, 0);
    if (maxY > 0) {
      visit(x, maxY);
    }
  }

  for (let y = 1; y < maxY; y += 1) {
    visit(0, y);
    if (maxX > 0) {
      visit(maxX, y);
    }
  }

  return {
    red: count ? red / count : 0,
    green: count ? green / count : 0,
    blue: count ? blue / count : 0
  };
};

const colorDistance = (
  pixel: { red: number; green: number; blue: number },
  reference: { red: number; green: number; blue: number }
) =>
  Math.sqrt(
    (pixel.red - reference.red) ** 2 +
      (pixel.green - reference.green) ** 2 +
      (pixel.blue - reference.blue) ** 2
  );

const createDiagnosticMaskArtifacts = async (sourceImageBytes: Uint8Array) => {
  const { data, info } = await normalizeImageForMask(sourceImageBytes);
  const borderAverage = sampleBorderAverage(data, info.width, info.height, info.channels);
  const maskRaw = Buffer.alloc(info.width * info.height);
  const overlayRaw = Buffer.alloc(info.width * info.height * 4);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const pixelIndex = (y * info.width + x) * info.channels;
      const maskIndex = y * info.width + x;
      const red = data[pixelIndex] ?? 0;
      const green = data[pixelIndex + 1] ?? 0;
      const blue = data[pixelIndex + 2] ?? 0;
      const alpha = data[pixelIndex + 3] ?? 255;
      const edgeDistance =
        Math.min(x, info.width - 1 - x, y, info.height - 1 - y) <= BORDER_SAMPLE_SIZE;
      const likelyBackground =
        alpha < 8 ||
        colorDistance({ red, green, blue }, borderAverage) < BACKGROUND_DISTANCE_THRESHOLD ||
        edgeDistance;
      const maskValue = likelyBackground ? 255 : 0;
      maskRaw[maskIndex] = maskValue;

      const overlayIndex = maskIndex * 4;
      overlayRaw[overlayIndex] = 227;
      overlayRaw[overlayIndex + 1] = 58;
      overlayRaw[overlayIndex + 2] = 44;
      overlayRaw[overlayIndex + 3] = likelyBackground ? 110 : 0;
    }
  }

  const maskPng = await sharp(maskRaw, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 1
    }
  })
    .png()
    .toBuffer();

  const overlayPng = await sharp(sourceImageBytes)
    .rotate()
    .ensureAlpha()
    .composite([
      {
        input: overlayRaw,
        raw: {
          width: info.width,
          height: info.height,
          channels: 4
        }
      }
    ])
    .png()
    .toBuffer();

  return {
    maskPng,
    overlayPng
  };
};

const inspectVertexImageResponse = (payload: unknown) => {
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
  const predictionDebug: ProviderPredictionDebug[] = [];

  predictions.forEach((prediction, index) => {
    const bytesBase64Encoded =
      typeof prediction.bytesBase64Encoded === 'string' ? prediction.bytesBase64Encoded : null;
    const mimeType =
      typeof prediction.mimeType === 'string' && prediction.mimeType ? prediction.mimeType : null;
    const fieldsPresent = Object.keys(prediction);
    const base64 = summarizeBase64(bytesBase64Encoded);

    if (!bytesBase64Encoded) {
      predictionDebug.push({
        index,
        fieldsPresent,
        selectedImageField: null,
        mimeType,
        base64,
        decodedByteLength: null,
        sha256: null,
        decodeSucceeded: false,
        decodeError: 'Prediction does not contain bytesBase64Encoded.'
      });
      return;
    }

    try {
      const bytes = Uint8Array.from(Buffer.from(bytesBase64Encoded, 'base64'));
      const binarySummary = summarizeBinaryAsset({
        label: `prediction-${index + 1}`,
        bytes,
        mimeType: mimeType ?? 'image/png',
        base64: bytesBase64Encoded
      });

      images.push({
        bytes,
        mimeType: mimeType ?? 'image/png'
      });

      predictionDebug.push({
        index,
        fieldsPresent,
        selectedImageField: 'bytesBase64Encoded',
        mimeType: mimeType ?? 'image/png',
        base64,
        decodedByteLength: binarySummary.byteLength,
        sha256: binarySummary.sha256,
        decodeSucceeded: true,
        decodeError: null
      });
    } catch (error) {
      predictionDebug.push({
        index,
        fieldsPresent,
        selectedImageField: 'bytesBase64Encoded',
        mimeType,
        base64,
        decodedByteLength: null,
        sha256: null,
        decodeSucceeded: false,
        decodeError: error instanceof Error ? error.message : 'Base64 decode failed.'
      });
    }
  });

  if (!images.length) {
    throw new VertexProviderError('Vertex response did not return any images.', {
      details: payload
    });
  }

  return {
    images,
    predictionDebug
  };
};

const createProviderDebugRequest = (
  input: CreateGenerationInput,
  plan: VertexExecutionPlan,
  configuration: ReturnType<typeof vertexClient.getConfiguration>,
  requestPayload: Record<string, unknown>,
  sourceImage: BinaryAssetDebug | null,
  maskImage: BinaryAssetDebug | null,
  runtimeOptions?: GenerationRuntimeOptions
): ProviderDebugRequest => {
  const requestType = getRequestType(input.mode);
  const endpointUrl = plan.useVertex ? vertexClient.getPredictUrl(configuration.model) : null;

  return {
    runId: runtimeOptions?.debugRunId ?? 'preview',
    mode: input.mode,
    provider: plan.provider,
    model: plan.useVertex ? configuration.model : plan.model,
    configured: configuration.configured,
    preferredFlow: runtimeOptions?.providerPreference ?? 'real',
    plannedFlow: plan.provider,
    fallbackReason: plan.reason,
    requestType,
    requestEndpoint: plan.useVertex ? 'predict' : 'dev-fake',
    endpointUrl,
    negativePromptText: null,
    sourceImageIncluded: true,
    maskIncluded: plan.useVertex && input.mode === 'environment_edit',
    targetRegionIncluded: input.mode === 'room_insert' && Boolean(input.placement),
    sampleCount: clampSampleCount(input.variantsRequested),
    editStrategy: getEditStrategy(input.mode, plan),
    modelHint: getModelHint(plan.useVertex ? configuration.model : plan.model, requestType),
    sourceImage,
    maskImage,
    requestBody: requestPayload,
    providerParameters: {
      sampleCount: clampSampleCount(input.variantsRequested),
      editMode: plan.useVertex && input.mode === 'environment_edit' ? ENVIRONMENT_EDIT_MODE : null,
      maskMode: plan.useVertex && input.mode === 'environment_edit' ? ENVIRONMENT_MASK_MODE : null,
      stylePreset: input.stylePreset,
      lightPreset: input.lightPreset,
      variantsRequested: input.variantsRequested
    },
    decisionFlags: {
      providerPreference: runtimeOptions?.providerPreference ?? 'real',
      providerDebugEnabled: runtimeOptions?.providerDebugEnabled ?? false,
      vertexConfigured: configuration.configured,
      useVertex: plan.useVertex,
      modeEligibleForVertex: input.mode === 'environment_edit',
      sampleCountClamped: clampSampleCount(input.variantsRequested),
      placementProvided: Boolean(input.placement),
      automaticBackgroundMask: plan.useVertex && input.mode === 'environment_edit',
      diagnosticMaskVisualizationIsApproximation:
        plan.useVertex && input.mode === 'environment_edit'
    }
  };
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
          referenceType: 'REFERENCE_TYPE_SUBJECT',
          referenceId: 1,
          referenceImage: {
            bytesBase64Encoded: sourceImageBase64
          },
          subjectImageConfig: {
            subjectType: 'SUBJECT_TYPE_PRODUCT',
            subjectDescription: 'furniture piece'
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
  return inspectVertexImageResponse(payload).images;
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
  ): PreparedVertexRequest {
    const plan = this.getExecutionPlan(input.mode, input.variantsRequested, runtimeOptions);
    const configuration = vertexClient.getConfiguration();
    const requestPayload =
      plan.useVertex && input.mode === 'environment_edit'
        ? (sanitizeProviderPayload(
            buildEnvironmentEditVertexPayload(input, promptText, '<omitted-base64-image>')
          ) as Record<string, unknown>)
        : {
            mode: input.mode,
            promptText,
            variantsRequested: input.variantsRequested
          };
    const providerDebug = createProviderDebugRequest(
      input,
      plan,
      configuration,
      requestPayload,
      null,
      plan.useVertex && input.mode === 'environment_edit'
        ? {
            label: 'automatic-background-mask',
            mimeType: null,
            byteLength: null,
            base64: null,
            sha256: null
          }
        : null,
      runtimeOptions
    );

    if (plan.useVertex && input.mode === 'environment_edit') {
      return {
        provider: plan.provider,
        configured: configuration.configured,
        model: configuration.model || 'unconfigured',
        payload: requestPayload,
        providerDebug
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
      },
      providerDebug
    };
  }

  async generateEnvironmentEdit(
    input: CreateGenerationInput,
    promptText: string,
    sourceImageBytes: Uint8Array,
    runtimeOptions?: GenerationRuntimeOptions,
    sourceImageMimeType?: string | null
  ) {
    const configuration = vertexClient.getConfiguration();
    const runId = runtimeOptions?.debugRunId ?? 'unknown-run';
    const debugLogger = createVertexDebugLogger(runId, true);

    if (!configuration.configured) {
      throw new VertexProviderError('Vertex configuration is incomplete.');
    }

    const endpointUrl = vertexClient.getPredictUrl(configuration.model);
    const sourceImageBase64 = toBase64(sourceImageBytes);
    const payload = buildEnvironmentEditVertexPayload(input, promptText, sourceImageBase64);
    const sourceImage = summarizeBinaryAsset({
      label: 'source-image',
      bytes: sourceImageBytes,
      mimeType: sourceImageMimeType ?? 'image/png',
      base64: sourceImageBase64
    });
    const diagnosticMaskArtifacts = await createDiagnosticMaskArtifacts(sourceImageBytes);
    const requestPayload = sanitizeProviderPayload(payload) as Record<string, unknown>;
    const requestType = getRequestType(input.mode);
    const modelHint = getModelHint(configuration.model, requestType);
    const providerDebugRequest = createProviderDebugRequest(
      input,
      {
        useVertex: true,
        reason: null,
        configured: true,
        provider: 'vertex',
        model: configuration.model
      },
      configuration,
      requestPayload,
      sourceImage,
      {
        label: 'automatic-background-mask',
        mimeType: null,
        byteLength: null,
        base64: null,
        sha256: null
      },
      runtimeOptions
    );
    const artifacts: ProviderArtifactDebug[] = [];

    debugLogger.log('route-service-entry', {
      runId,
      requestType,
      mode: input.mode,
      sourceImageId: input.sourceImageId,
      projectId: input.projectId,
      sampleCount: clampSampleCount(input.variantsRequested),
      sourceImage,
      maskImage: providerDebugRequest.maskImage,
      providerParameters: providerDebugRequest.providerParameters,
      decisionFlags: providerDebugRequest.decisionFlags
    });

    const requestArtifact = await debugLogger.writeJson('provider-request', {
      endpointUrl,
      model: configuration.model,
      requestType,
      promptText,
      negativePromptText: null,
      payload: requestPayload
    });

    if (requestArtifact) {
      artifacts.push({
        label: 'provider-request',
        relativePath: requestArtifact,
        mimeType: 'application/json',
        byteLength: null,
        sha256: null
      });
    }

    const promptArtifact = await debugLogger.writeText('final-prompt', promptText);

    if (promptArtifact) {
      artifacts.push({
        label: 'final-prompt',
        relativePath: promptArtifact,
        mimeType: 'text/plain',
        byteLength: null,
        sha256: null
      });
    }

    const inputArtifact = await debugLogger.writeBinaryArtifact({
      name: 'input-original',
      extension: 'png',
      label: 'input-original',
      bytes: sourceImageBytes,
      mimeType: sourceImageMimeType ?? 'image/png'
    });

    if (inputArtifact) {
      artifacts.push(inputArtifact);
    }

    const automaticMaskArtifact = await debugLogger.writeBinaryArtifact({
      name: 'input-mask-approximation',
      extension: 'png',
      label: 'input-mask-approximation',
      bytes: diagnosticMaskArtifacts.maskPng,
      mimeType: 'image/png'
    });

    if (automaticMaskArtifact) {
      artifacts.push(automaticMaskArtifact);
    }

    const automaticMaskOverlayArtifact = await debugLogger.writeBinaryArtifact({
      name: 'input-mask-overlay',
      extension: 'png',
      label: 'input-mask-overlay',
      bytes: diagnosticMaskArtifacts.overlayPng,
      mimeType: 'image/png'
    });

    if (automaticMaskOverlayArtifact) {
      artifacts.push(automaticMaskOverlayArtifact);
    }

    const accessToken = await vertexClient.getAccessToken();
    const response = await fetch(endpointUrl, {
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
      debugLogger.log('provider-http-response', {
        runId,
        status: response.status,
        rawResponsePreview: previewRawResponse(rawResponse),
        responseRootKeys: getResponseRootKeys(parsedResponse)
      });

      throw new VertexProviderError(`Vertex request failed with status ${response.status}.`, {
        status: response.status,
        details: parsedResponse
      });
    }

    const responseArtifact = await debugLogger.writeJson('provider-response', {
      status: response.status,
      responseRootKeys: getResponseRootKeys(parsedResponse),
      parsedResponse
    });

    if (responseArtifact) {
      artifacts.push({
        label: 'provider-response',
        relativePath: responseArtifact,
        mimeType: 'application/json',
        byteLength: null,
        sha256: null
      });
    }

    const { images, predictionDebug } = inspectVertexImageResponse(parsedResponse);
    const outputByteSizes = images.map((image) => image.bytes.byteLength);

    for (const [index, image] of images.entries()) {
      const outputArtifact = await debugLogger.writeBinaryArtifact({
        name: `provider-output-${index + 1}`,
        extension: image.mimeType === 'image/jpeg' ? 'jpg' : 'png',
        label: `provider-output-${index + 1}`,
        bytes: image.bytes,
        mimeType: image.mimeType
      });

      if (outputArtifact) {
        artifacts.push(outputArtifact);
      }
    }

    debugLogger.log('provider-http-response', {
      runId,
      endpointUrl,
      status: response.status,
      responseRootKeys: getResponseRootKeys(parsedResponse),
      rawResponsePreview: previewRawResponse(rawResponse),
      predictionDebug
    });

    debugLogger.log('response-mapping', {
      runId,
      selectedField: 'bytesBase64Encoded',
      predictionsCount: predictionDebug.length,
      predictionDebug
    });

    return {
      provider: 'vertex' as const,
      model: configuration.model,
      usage: {
        fakeGeneration: false,
        sampleCount: clampSampleCount(input.variantsRequested),
        rawPredictionCount: getPredictionCount(parsedResponse) ?? images.length,
        providerDebug: {
          request: providerDebugRequest
        }
      },
      providerDebug: {
        runId,
        usedFlow: 'vertex',
        model: configuration.model,
        requestType,
        requestEndpoint: 'predict',
        endpointUrl,
        sourceImageIncluded: true,
        maskIncluded: true,
        targetRegionIncluded: false,
        sampleCount: clampSampleCount(input.variantsRequested),
        fakeFallbackUsed: false,
        fallbackReason: null,
        responseStatus: response.status,
        predictionsCount: getPredictionCount(parsedResponse) ?? images.length,
        outputMimeTypes: images.map((image) => image.mimeType),
        outputByteSizes,
        totalOutputBytes: outputByteSizes.reduce((sum, size) => sum + size, 0),
        responseMetadata: getResponseMetadata(parsedResponse),
        responseRootKeys: getResponseRootKeys(parsedResponse),
        rawResponsePreview: previewRawResponse(rawResponse),
        predictions: predictionDebug,
        artifacts,
        persistedImages: [],
        editStrategy:
          'Imagen-Edit mit Quellbild und automatischer Hintergrundmaske (Background Swap), ohne explizite Zielregion.',
        modelHint,
        error: null
      },
      images
    } satisfies VertexGenerationResult;
  }
}

export const vertexImageService = new VertexImageService();
