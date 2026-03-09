import { eq } from 'drizzle-orm';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { costLogs, generations } from '$lib/server/db/schema';
import { promptBuilder } from '$lib/server/prompt-builder';
import { imageService } from '$lib/server/services/ImageService';
import { roomPlacementService } from '$lib/server/services/RoomPlacementService';
import { storage } from '$lib/server/storage';
import type { PostGenerationResponse } from '$lib/types/api';
import type {
  CreateGenerationInput,
  GenerationRuntimeOptions,
  ProviderDebugRequest,
  ProviderDebugRun,
  ProviderPredictionDebug
} from '$lib/types/generation';
import { vertexCostEstimationService } from '$lib/server/vertex/cost-estimation';
import {
  createDebugRunId,
  createVertexDebugLogger,
  previewRawResponse,
  sha256Hex,
  summarizeBase64
} from '$lib/server/vertex/debug';
import {
  VertexProviderError,
  type VertexGenerationResult,
  vertexImageService
} from '$lib/server/vertex/image';
import {
  callGeminiImageEdit,
  GEMINI_FLASH_IMAGE_MODEL,
  GEMINI_IMAGE_MODEL,
  getGeminiGenerateContentUrl
} from '$lib/server/vertex/gemini-image';
import { vertexClient } from '$lib/server/vertex/client';

type PromptBuildResult = ReturnType<typeof promptBuilder.build>;

type PersistedImage = Awaited<ReturnType<typeof imageService.createGeneratedVariant>>;

type GenerationExecutionResult = {
  provider: 'vertex' | 'dev-fake';
  model: string;
  images: PersistedImage[];
  usageJson: Record<string, unknown>;
  providerDebugRun: ProviderDebugRun;
};

const getActiveImageModel = (runtimeOptions?: GenerationRuntimeOptions) =>
  runtimeOptions?.imageModel === 'gemini-3-pro-image' ||
  runtimeOptions?.imageModel === 'gemini-3.1-flash-image-preview'
    ? runtimeOptions.imageModel
    : 'imagen-3';

const getGeminiModelId = (imageModel: 'gemini-3-pro-image' | 'gemini-3.1-flash-image-preview') =>
  imageModel === 'gemini-3.1-flash-image-preview' ? GEMINI_FLASH_IMAGE_MODEL : GEMINI_IMAGE_MODEL;

export class GenerationService {
  previewGeneration(input: CreateGenerationInput, runtimeOptions?: GenerationRuntimeOptions) {
    const normalizedPlacement = roomPlacementService.normalizePlacement(input.placement);

    return promptBuilder.build(
      {
        ...input,
        placement: normalizedPlacement
      },
      runtimeOptions
    ).promptDebug;
  }

  async createGeneration(
    input: CreateGenerationInput,
    runtimeOptions?: GenerationRuntimeOptions
  ): Promise<PostGenerationResponse> {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const debugRunId = runtimeOptions?.debugRunId ?? createDebugRunId();
    const debugLogger = createVertexDebugLogger(debugRunId, true);
    const normalizedPlacement = roomPlacementService.normalizePlacement(input.placement);
    const sourceImage = await imageService.getImage(input.sourceImageId);
    const activeImageModel = getActiveImageModel(runtimeOptions);
    const runtimeOptionsWithDebug = {
      ...runtimeOptions,
      debugRunId,
      imageModel: activeImageModel
    } satisfies GenerationRuntimeOptions;

    if (sourceImage.projectId !== input.projectId) {
      throw new Error('Source image does not belong to the provided project.');
    }

    if (input.mode === 'room_placement') {
      const validation = roomPlacementService.validatePlacement(normalizedPlacement);

      if (!validation.valid) {
        throw new Error(validation.message || 'Placement is invalid.');
      }

      if (!normalizedPlacement) {
        throw new Error('Placement is required for room_placement mode.');
      }

      if (normalizedPlacement.roomImageId === sourceImage.id) {
        throw new Error('Room image and furniture image must be different.');
      }

      const roomImage = await imageService.getImage(normalizedPlacement.roomImageId);

      if (roomImage.projectId !== input.projectId) {
        throw new Error('Room image does not belong to the provided project.');
      }
    }

    const prompt = promptBuilder.build(
      {
        ...input,
        placement: normalizedPlacement
      },
      runtimeOptionsWithDebug
    );
    const executionPlan = vertexImageService.getExecutionPlan(
      input.mode,
      input.variantsRequested,
      runtimeOptionsWithDebug
    );
    const requestSkeleton = vertexImageService.prepareRequest(
      {
        ...input,
        placement: normalizedPlacement
      },
      prompt.promptText,
      runtimeOptionsWithDebug
    );
    const estimate = vertexCostEstimationService.estimateVariants(
      input.mode,
      input.variantsRequested
    );
    const useGeminiImageModel =
      activeImageModel !== 'imagen-3' && input.mode === 'environment_edit';
    const geminiModelId =
      activeImageModel === 'imagen-3' ? null : getGeminiModelId(activeImageModel);
    const requestedModel =
      executionPlan.useVertex && useGeminiImageModel && geminiModelId
        ? geminiModelId
        : executionPlan.model;
    const db = getDb();

    debugLogger.log('generation-entry', {
      runId: debugRunId,
      projectId: input.projectId,
      sourceImageId: input.sourceImageId,
      generationMode: input.mode,
      requestType: requestSkeleton.providerDebug.requestType,
      sourceImagePresent: true,
      sourceImageMimeType: sourceImage.mimeType,
      sourceImagePath: sourceImage.filePath,
      maskPresent: false,
      sampleCount: requestSkeleton.providerDebug.sampleCount,
      providerParameters: requestSkeleton.providerDebug.providerParameters,
      plannedFlow: requestSkeleton.providerDebug.plannedFlow
    });

    await debugLogger.writeJson('generation-entry', {
      runId: debugRunId,
      input: {
        ...input,
        placement: normalizedPlacement
      },
      sourceImage: {
        id: sourceImage.id,
        filePath: sourceImage.filePath,
        mimeType: sourceImage.mimeType,
        width: sourceImage.width,
        height: sourceImage.height
      }
    });

    await debugLogger.writeJson('prompt-builder', {
      runId: debugRunId,
      promptInput: {
        mode: input.mode,
        materialEditSubMode: input.materialEditSubMode ?? null,
        stylePreset: input.stylePreset,
        lightPreset: input.lightPreset,
        instructions: input.instructions,
        targetMaterial: input.targetMaterial,
        surfaceDescription: input.surfaceDescription,
        preserveObject: input.preserveObject,
        preservePerspective: input.preservePerspective,
        protectionRules: input.protectionRules ?? null,
        placement: normalizedPlacement
      },
      finalPrompt: prompt.promptText,
      negativePrompt: null,
      instructionDebug: prompt.promptDebug.instructionDebug,
      decisionFlags: requestSkeleton.providerDebug.decisionFlags
    });

    const [generation] = await db
      .insert(generations)
      .values({
        projectId: input.projectId,
        userId: sourceImage.userId,
        sourceImageId: sourceImage.id,
        provider: executionPlan.provider,
        model: requestedModel,
        mode: input.mode,
        promptText: prompt.promptText,
        systemPromptText: prompt.systemPromptText,
        settingsJson: {
          stylePreset: input.stylePreset,
          lightPreset: input.lightPreset,
          materialEditSubMode: input.materialEditSubMode ?? null,
          instructions: input.instructions,
          targetMaterial: input.targetMaterial,
          surfaceDescription: input.surfaceDescription,
          placement: normalizedPlacement,
          preserveObject: input.preserveObject,
          preservePerspective: input.preservePerspective,
          protectionRules: input.protectionRules ?? null,
          variantsRequested: input.variantsRequested,
          debugRunId,
          requestedProvider: executionPlan.useVertex ? 'vertex' : 'dev-fake',
          vertexFallbackReason: executionPlan.reason,
          providerPreference: runtimeOptionsWithDebug.providerPreference ?? 'real',
          providerDebugEnabled: runtimeOptionsWithDebug.providerDebugEnabled ?? false,
          imageModel: activeImageModel,
          // Real Vertex is only enabled for environment_edit in this phase.
          realVertexEligible: executionPlan.useVertex
        },
        variantsRequested: input.variantsRequested,
        variantsReturned: 0,
        usageJson: {
          fakeGeneration: !executionPlan.useVertex,
          requestConfiguredForVertex: requestSkeleton.configured,
          estimatedCost: estimate.estimatedCost,
          unitPrice: estimate.unitPrice,
          debugRunId,
          vertexRequested: executionPlan.useVertex,
          vertexFallbackReason: executionPlan.reason,
          providerDebug: {
            request: requestSkeleton.providerDebug,
            run: null
          }
        },
        estimatedCost: String(estimate.estimatedCost),
        actualCost: '0',
        status: 'pending'
      })
      .returning({
        id: generations.id
      });

    await db
      .update(generations)
      .set({
        status: 'running'
      })
      .where(eq(generations.id, generation.id));

    try {
      const executionResult = executionPlan.useVertex
        ? useGeminiImageModel
          ? await this.executeWithGeminiFallback({
              generationId: generation.id,
              input: {
                ...input,
                placement: normalizedPlacement
              },
              prompt,
              sourceImage,
              runtimeOptions: runtimeOptionsWithDebug
            })
          : await this.executeWithVertexFallback({
              generationId: generation.id,
              input: {
                ...input,
                placement: normalizedPlacement
              },
              prompt,
              sourceImage,
              runtimeOptions: runtimeOptionsWithDebug
            })
        : await this.executeFakeGeneration({
            generationId: generation.id,
            input: {
              ...input,
              placement: normalizedPlacement
            },
            prompt,
            fallbackReason: executionPlan.reason,
            vertexAttempted: false,
            runtimeOptions: runtimeOptionsWithDebug
          });

      const actualCost = Number((executionResult.images.length * estimate.unitPrice).toFixed(4));

      await db
        .update(generations)
        .set({
          provider: executionResult.provider,
          model: executionResult.model,
          status: 'succeeded',
          variantsReturned: executionResult.images.length,
          actualCost: String(actualCost),
          usageJson: {
            ...executionResult.usageJson,
            requestConfiguredForVertex: requestSkeleton.configured,
            variantsReturned: executionResult.images.length,
            actualCost,
            unitPrice: estimate.unitPrice
          }
        })
        .where(eq(generations.id, generation.id));

      await db.insert(costLogs).values({
        generationId: generation.id,
        provider: executionResult.provider,
        model: executionResult.model,
        unitType: estimate.unitType,
        quantity: String(executionResult.images.length),
        unitPrice: String(estimate.unitPrice),
        totalPrice: String(actualCost),
        currency: estimate.currency
      });

      return {
        generation: {
          id: generation.id,
          status: 'succeeded',
          variantsReturned: executionResult.images.length
        },
        promptDebug: {
          ...prompt.promptDebug,
          providerDebug: {
            request: prompt.promptDebug.providerDebug.request,
            run: executionResult.providerDebugRun
          }
        },
        images: executionResult.images.map((image) => ({
          id: image.id,
          parentImageId: image.parentImageId,
          thumbnailPath: image.thumbnailPath
        }))
      };
    } catch (error) {
      await db
        .update(generations)
        .set({
          status: 'failed',
          usageJson: {
            fakeGeneration: !executionPlan.useVertex,
            debugRunId,
            error: error instanceof Error ? error.message : 'unknown error',
            providerDebug: {
              request: requestSkeleton.providerDebug,
              run: null
            }
          }
        })
        .where(eq(generations.id, generation.id));

      debugLogger.log('generation-failed', {
        runId: debugRunId,
        error: error instanceof Error ? error.message : 'unknown error'
      });

      throw error;
    }
  }

  private async executeWithVertexFallback(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    sourceImage: Awaited<ReturnType<typeof imageService.getImage>>;
    runtimeOptions: GenerationRuntimeOptions;
  }): Promise<GenerationExecutionResult> {
    try {
      const sourceImageBytes = await storage.readAsset(options.sourceImage.filePath);
      const providerResult = await vertexImageService.generateEnvironmentEdit(
        options.input,
        options.prompt.promptText,
        sourceImageBytes,
        options.runtimeOptions,
        options.sourceImage.mimeType
      );

      return await this.persistVertexResult({
        generationId: options.generationId,
        input: options.input,
        prompt: options.prompt,
        providerResult,
        runtimeOptions: options.runtimeOptions
      });
    } catch (error) {
      // Vertex failures fall back to the existing fake flow so the editor remains usable in dev.
      const fallbackReason =
        error instanceof VertexProviderError ? error.message : 'Unknown Vertex provider error.';

      return this.executeFakeGeneration({
        generationId: options.generationId,
        input: options.input,
        prompt: options.prompt,
        fallbackReason,
        vertexAttempted: true,
        vertexError: error,
        runtimeOptions: options.runtimeOptions
      });
    }
  }

  private async executeWithGeminiFallback(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    sourceImage: Awaited<ReturnType<typeof imageService.getImage>>;
    runtimeOptions: GenerationRuntimeOptions;
  }): Promise<GenerationExecutionResult> {
    try {
      const sourceImageBytes = await storage.readAsset(options.sourceImage.filePath);
      const projectId = vertexClient.getConfiguration().projectId;
      const accessToken = await vertexClient.getAccessToken();
      const geminiModelId = getGeminiModelId(
        options.runtimeOptions.imageModel === 'gemini-3.1-flash-image-preview'
          ? 'gemini-3.1-flash-image-preview'
          : 'gemini-3-pro-image'
      );
      const providerResponses = await Promise.all(
        Array.from({ length: options.input.variantsRequested }, () =>
          callGeminiImageEdit(
            {
              sourceImageBase64: Buffer.from(sourceImageBytes).toString('base64'),
              sourceImageMimeType: options.sourceImage.mimeType,
              promptText: options.prompt.promptText
            },
            projectId,
            accessToken,
            geminiModelId
          )
        )
      );
      // Flash Image returns one image per request; multiple variants stay as separate calls.
      const images = providerResponses.map((response) => ({
        bytes: Buffer.from(response.imageBase64, 'base64'),
        mimeType: response.mimeType
      }));
      const outputByteSizes = images.map((image) => image.bytes.byteLength);
      const predictions: ProviderPredictionDebug[] = providerResponses.map((response, index) => ({
        index,
        fieldsPresent: response.text ? ['inlineData', 'text'] : ['inlineData'],
        selectedImageField: 'inlineData',
        mimeType: response.mimeType,
        base64: summarizeBase64(response.imageBase64),
        decodedByteLength: images[index]?.bytes.byteLength ?? null,
        sha256: images[index] ? sha256Hex(images[index].bytes) : null,
        decodeSucceeded: true,
        decodeError: null
      }));
      const providerDebugRun: ProviderDebugRun = {
        runId: options.runtimeOptions.debugRunId ?? createDebugRunId(),
        usedFlow: 'vertex',
        model: geminiModelId,
        requestType: 'generate',
        requestEndpoint: 'generateContent',
        endpointUrl: getGeminiGenerateContentUrl(projectId, geminiModelId),
        sourceImageIncluded: true,
        maskIncluded: false,
        targetRegionIncluded: false,
        sampleCount: options.input.variantsRequested,
        fakeFallbackUsed: false,
        fallbackReason: null,
        responseStatus: 200,
        predictionsCount: images.length,
        outputMimeTypes: images.map((image) => image.mimeType),
        outputByteSizes,
        totalOutputBytes: outputByteSizes.reduce((sum, size) => sum + size, 0),
        responseMetadata: null,
        responseRootKeys: ['candidates'],
        rawResponsePreview: previewRawResponse(
          JSON.stringify({
            candidates: providerResponses.map((response) => ({
              content: {
                parts: [
                  ...(response.text ? [{ text: response.text }] : []),
                  {
                    inlineData: {
                      mimeType: response.mimeType,
                      data: '<omitted-base64-image>'
                    }
                  }
                ]
              }
            }))
          })
        ),
        predictions,
        artifacts: [],
        persistedImages: [],
        editStrategy: 'Gemini generateContent mit Quellbild und freiem Edit-Prompt.',
        modelHint: null,
        error: null
      };
      const providerResult: VertexGenerationResult = {
        provider: 'vertex',
        model: geminiModelId,
        usage: {
          fakeGeneration: false,
          geminiTextResponses: providerResponses.map((response) => response.text ?? null)
        },
        providerDebug: providerDebugRun,
        images
      };

      return await this.persistVertexResult({
        generationId: options.generationId,
        input: options.input,
        prompt: options.prompt,
        providerResult,
        runtimeOptions: options.runtimeOptions
      });
    } catch (error) {
      const fallbackReason =
        error instanceof Error ? error.message : 'Unknown Gemini provider error.';

      return this.executeFakeGeneration({
        generationId: options.generationId,
        input: options.input,
        prompt: options.prompt,
        fallbackReason,
        vertexAttempted: true,
        vertexError: error,
        runtimeOptions: options.runtimeOptions
      });
    }
  }

  private async persistVertexResult(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    providerResult: VertexGenerationResult;
    runtimeOptions: GenerationRuntimeOptions;
  }): Promise<GenerationExecutionResult> {
    const createdImages = await Promise.all(
      options.providerResult.images.map((image, index) =>
        imageService.createGeneratedVariant({
          sourceImageId: options.input.sourceImageId,
          generationId: options.generationId,
          mode: options.input.mode,
          variantIndex: index,
          placement: options.input.placement,
          promptSnapshot: {
            mode: options.input.mode,
            systemPromptText: options.prompt.systemPromptText,
            promptText: options.prompt.promptText,
            promptFragments: options.prompt.promptFragments,
            promptDebug: options.prompt.promptDebug
          },
          settingsSnapshot: {
            debugRunId: options.runtimeOptions.debugRunId,
            stylePreset: options.input.stylePreset,
            lightPreset: options.input.lightPreset,
            materialEditSubMode: options.input.materialEditSubMode ?? null,
            instructions: options.input.instructions,
            targetMaterial: options.input.targetMaterial,
            surfaceDescription: options.input.surfaceDescription,
            placement: options.input.placement,
            preserveObject: options.input.preserveObject,
            preservePerspective: options.input.preservePerspective,
            protectionRules: options.input.protectionRules ?? null,
            variantsRequested: options.input.variantsRequested
          },
          generatedAsset: {
            bytes: image.bytes,
            mimeType: image.mimeType,
            provider: 'vertex'
          }
        })
      )
    );
    const persistedImages = await this.collectPersistedImageDebug({
      runId: options.providerResult.providerDebug.runId,
      images: createdImages,
      providerImages: options.providerResult.images,
      providerDebugEnabled: true
    });

    options.providerResult.providerDebug.persistedImages = persistedImages.debugEntries;
    options.providerResult.providerDebug.artifacts.push(...persistedImages.artifacts);

    createVertexDebugLogger(options.providerResult.providerDebug.runId, true).log(
      'storage-persistence',
      {
        runId: options.providerResult.providerDebug.runId,
        persistedImages: persistedImages.debugEntries
      }
    );

    return {
      provider: 'vertex',
      model: options.providerResult.model,
      images: createdImages,
      usageJson: {
        ...options.providerResult.usage,
        fakeGeneration: false,
        vertexAttempted: true,
        vertexFallbackUsed: false,
        providerDebug: {
          request: options.prompt.promptDebug.providerDebug.request,
          run: options.providerResult.providerDebug
        }
      },
      providerDebugRun: options.providerResult.providerDebug
    };
  }

  private async executeFakeGeneration(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    fallbackReason: string | null;
    vertexAttempted: boolean;
    vertexError?: unknown;
    runtimeOptions: GenerationRuntimeOptions;
  }): Promise<GenerationExecutionResult> {
    const createdImages = await Promise.all(
      Array.from({ length: options.input.variantsRequested }, (_, index) =>
        imageService.createGeneratedVariant({
          sourceImageId: options.input.sourceImageId,
          generationId: options.generationId,
          mode: options.input.mode,
          variantIndex: index,
          placement: options.input.placement,
          promptSnapshot: {
            mode: options.input.mode,
            systemPromptText: options.prompt.systemPromptText,
            promptText: options.prompt.promptText,
            promptFragments: options.prompt.promptFragments,
            promptDebug: options.prompt.promptDebug
          },
          settingsSnapshot: {
            debugRunId: options.runtimeOptions.debugRunId,
            stylePreset: options.input.stylePreset,
            lightPreset: options.input.lightPreset,
            materialEditSubMode: options.input.materialEditSubMode ?? null,
            instructions: options.input.instructions,
            targetMaterial: options.input.targetMaterial,
            surfaceDescription: options.input.surfaceDescription,
            placement: options.input.placement,
            preserveObject: options.input.preserveObject,
            preservePerspective: options.input.preservePerspective,
            protectionRules: options.input.protectionRules ?? null,
            variantsRequested: options.input.variantsRequested,
            vertexFallbackReason: options.fallbackReason
          }
        })
      )
    );
    const providerDebugRun = this.createFakeProviderDebugRun(
      options.prompt.promptDebug.providerDebug.request,
      createdImages,
      options.fallbackReason,
      options.vertexError
    );
    const persistedImages = await this.collectPersistedImageDebug({
      runId: providerDebugRun.runId,
      images: createdImages,
      providerImages: null,
      providerDebugEnabled: true
    });
    providerDebugRun.persistedImages = persistedImages.debugEntries;
    providerDebugRun.artifacts.push(...persistedImages.artifacts);

    return {
      provider: 'dev-fake',
      model: `${options.input.mode}-fake`,
      images: createdImages,
      usageJson: {
        fakeGeneration: true,
        vertexAttempted: options.vertexAttempted,
        vertexFallbackUsed: true,
        vertexFallbackReason: options.fallbackReason,
        vertexError: options.vertexError instanceof Error ? options.vertexError.message : null,
        providerDebug: {
          request: options.prompt.promptDebug.providerDebug.request,
          run: providerDebugRun
        }
      },
      providerDebugRun
    };
  }

  private createFakeProviderDebugRun(
    request: ProviderDebugRequest,
    images: PersistedImage[],
    fallbackReason: string | null,
    error?: unknown
  ): ProviderDebugRun {
    const outputMimeTypes = images.map(() => 'image/png');
    const outputByteSizes = images
      .map((image) => (typeof image.byteSize === 'number' ? image.byteSize : null))
      .filter((size): size is number => size !== null);

    return {
      runId: request.runId,
      usedFlow: 'dev-fake',
      model: `${request.mode}-fake`,
      requestType: request.requestType,
      requestEndpoint: 'dev-fake',
      endpointUrl: request.endpointUrl,
      sourceImageIncluded: request.sourceImageIncluded,
      maskIncluded: request.maskIncluded,
      targetRegionIncluded: request.targetRegionIncluded,
      sampleCount: request.sampleCount,
      fakeFallbackUsed: true,
      fallbackReason,
      responseStatus: null,
      predictionsCount: images.length,
      outputMimeTypes,
      outputByteSizes,
      totalOutputBytes: outputByteSizes.length
        ? outputByteSizes.reduce((sum, size) => sum + size, 0)
        : null,
      responseMetadata: null,
      responseRootKeys: [],
      rawResponsePreview: null,
      predictions: [],
      artifacts: [],
      persistedImages: [],
      editStrategy: request.editStrategy,
      modelHint: request.modelHint,
      error: error instanceof Error ? error.message : null
    };
  }

  private async collectPersistedImageDebug(options: {
    runId: string;
    images: PersistedImage[];
    providerImages: VertexGenerationResult['images'] | null;
    providerDebugEnabled: boolean;
  }) {
    const debugLogger = createVertexDebugLogger(options.runId, options.providerDebugEnabled);
    const artifacts = (
      await Promise.all(
        options.images.flatMap((image, index) => [
          this.createStoredAssetArtifact(debugLogger, {
            label: `stored-output-${index + 1}`,
            filePath: image.filePath,
            mimeType: image.mimeType
          }),
          this.createStoredAssetArtifact(debugLogger, {
            label: `displayed-output-${index + 1}`,
            filePath: image.filePath,
            mimeType: image.mimeType
          })
        ])
      )
    ).filter((artifact): artifact is NonNullable<typeof artifact> => artifact !== null);

    const debugEntries = await Promise.all(
      options.images.map(async (image, index) => {
        const storedBytes = await storage.readAsset(image.filePath);
        const storedSha256 = sha256Hex(storedBytes);
        const providerOutput = options.providerImages?.[index] ?? null;
        const providerOutputSha256 = providerOutput ? sha256Hex(providerOutput.bytes) : null;
        const providerOutputByteLength = providerOutput ? providerOutput.bytes.byteLength : null;

        return {
          imageId: image.id,
          relativeFilePath: image.filePath,
          relativeThumbnailPath: image.thumbnailPath,
          editorUrl: `/editor/${image.id}`,
          downloadUrl: `/api/images/${image.id}/download?download=1`,
          displayedViaDownloadRoute: `/api/images/${image.id}/download`,
          mimeType: image.mimeType,
          storedByteLength: storedBytes.byteLength,
          storedSha256,
          providerOutputSha256,
          providerOutputByteLength,
          storedMatchesProvider: providerOutputSha256
            ? storedSha256 === providerOutputSha256
            : null,
          storedMatchesProviderReason:
            providerOutputSha256 && storedSha256 !== providerOutputSha256
              ? image.processingDebug
                ? image.processingDebug.reasons.join(' ')
                : 'Gespeicherte Datei weicht vom Provider-Output ab, aber es liegt kein Transformationsprotokoll vor.'
              : null,
          displayedOutputSha256: storedSha256,
          displayedMatchesStored: true,
          storageTransform: image.processingDebug ?? null
        };
      })
    );

    return {
      artifacts,
      debugEntries
    };
  }

  private async createStoredAssetArtifact(
    debugLogger: ReturnType<typeof createVertexDebugLogger>,
    input: {
      label: string;
      filePath: string;
      mimeType: string;
    }
  ) {
    const bytes = await storage.readAsset(input.filePath);

    return debugLogger.writeBinaryArtifact({
      name: input.label,
      extension: input.mimeType === 'image/jpeg' ? 'jpg' : 'png',
      label: input.label,
      bytes,
      mimeType: input.mimeType
    });
  }
}

export const generationService = new GenerationService();
