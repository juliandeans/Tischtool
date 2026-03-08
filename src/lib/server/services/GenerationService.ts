import { eq } from 'drizzle-orm';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { costLogs, generations } from '$lib/server/db/schema';
import { promptBuilder } from '$lib/server/prompt-builder';
import { imageService } from '$lib/server/services/ImageService';
import { roomPlacementService } from '$lib/server/services/RoomPlacementService';
import { storage } from '$lib/server/storage';
import type { PostGenerationResponse } from '$lib/types/api';
import type { CreateGenerationInput, GenerationRuntimeOptions } from '$lib/types/generation';
import { vertexCostEstimationService } from '$lib/server/vertex/cost-estimation';
import {
  VertexProviderError,
  type VertexGenerationResult,
  vertexImageService
} from '$lib/server/vertex/image';

type PromptBuildResult = ReturnType<typeof promptBuilder.build>;

type PersistedImage = Awaited<ReturnType<typeof imageService.createGeneratedVariant>>;

type GenerationExecutionResult = {
  provider: 'vertex' | 'dev-fake';
  model: string;
  images: PersistedImage[];
  usageJson: Record<string, unknown>;
};

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

    const normalizedPlacement = roomPlacementService.normalizePlacement(input.placement);
    const sourceImage = await imageService.getImage(input.sourceImageId);

    if (sourceImage.projectId !== input.projectId) {
      throw new Error('Source image does not belong to the provided project.');
    }

    if (input.mode === 'room_insert') {
      const validation = roomPlacementService.validatePlacement(normalizedPlacement);

      if (!validation.valid) {
        throw new Error(validation.message || 'Placement is invalid.');
      }

      if (!normalizedPlacement) {
        throw new Error('Placement is required for room_insert mode.');
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
      runtimeOptions
    );
    const executionPlan = vertexImageService.getExecutionPlan(
      input.mode,
      input.variantsRequested,
      runtimeOptions
    );
    const requestSkeleton = vertexImageService.prepareRequest(
      {
        ...input,
        placement: normalizedPlacement
      },
      prompt.promptText,
      runtimeOptions
    );
    const estimate = vertexCostEstimationService.estimateVariants(
      input.mode,
      input.variantsRequested
    );
    const db = getDb();

    const [generation] = await db
      .insert(generations)
      .values({
        projectId: input.projectId,
        userId: sourceImage.userId,
        sourceImageId: sourceImage.id,
        provider: executionPlan.provider,
        model: executionPlan.model,
        mode: input.mode,
        promptText: prompt.promptText,
        systemPromptText: prompt.systemPromptText,
        settingsJson: {
          stylePreset: input.stylePreset,
          lightPreset: input.lightPreset,
          instructions: input.instructions,
          targetMaterial: input.targetMaterial,
          surfaceDescription: input.surfaceDescription,
          placement: normalizedPlacement,
          preserveObject: input.preserveObject,
          preservePerspective: input.preservePerspective,
          protectionRules: input.protectionRules ?? null,
          variantsRequested: input.variantsRequested,
          requestedProvider: executionPlan.useVertex ? 'vertex' : 'dev-fake',
          vertexFallbackReason: executionPlan.reason,
          providerPreference: runtimeOptions?.providerPreference ?? 'real',
          providerDebugEnabled: runtimeOptions?.providerDebugEnabled ?? false,
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
          vertexRequested: executionPlan.useVertex,
          vertexFallbackReason: executionPlan.reason
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
        ? await this.executeWithVertexFallback({
            generationId: generation.id,
            input: {
              ...input,
              placement: normalizedPlacement
            },
            prompt,
            sourceImagePath: sourceImage.filePath
          })
        : await this.executeFakeGeneration({
            generationId: generation.id,
            input: {
              ...input,
              placement: normalizedPlacement
            },
            prompt,
            fallbackReason: executionPlan.reason,
            vertexAttempted: false
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
        promptDebug: prompt.promptDebug,
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
            error: error instanceof Error ? error.message : 'unknown error'
          }
        })
        .where(eq(generations.id, generation.id));

      throw error;
    }
  }

  private async executeWithVertexFallback(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    sourceImagePath: string;
  }): Promise<GenerationExecutionResult> {
    try {
      const sourceImageBytes = await storage.readAsset(options.sourceImagePath);
      const providerResult = await vertexImageService.generateEnvironmentEdit(
        options.input,
        options.prompt.promptText,
        sourceImageBytes
      );

      return await this.persistVertexResult({
        generationId: options.generationId,
        input: options.input,
        prompt: options.prompt,
        providerResult
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
        vertexError: error
      });
    }
  }

  private async persistVertexResult(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    providerResult: VertexGenerationResult;
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
            stylePreset: options.input.stylePreset,
            lightPreset: options.input.lightPreset,
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

    return {
      provider: 'vertex',
      model: options.providerResult.model,
      images: createdImages,
      usageJson: {
        ...options.providerResult.usage,
        fakeGeneration: false,
        vertexAttempted: true,
        vertexFallbackUsed: false
      }
    };
  }

  private async executeFakeGeneration(options: {
    generationId: string;
    input: CreateGenerationInput;
    prompt: PromptBuildResult;
    fallbackReason: string | null;
    vertexAttempted: boolean;
    vertexError?: unknown;
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
            stylePreset: options.input.stylePreset,
            lightPreset: options.input.lightPreset,
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

    return {
      provider: 'dev-fake',
      model: `${options.input.mode}-fake`,
      images: createdImages,
      usageJson: {
        fakeGeneration: true,
        vertexAttempted: options.vertexAttempted,
        vertexFallbackUsed: true,
        vertexFallbackReason: options.fallbackReason,
        vertexError: options.vertexError instanceof Error ? options.vertexError.message : null
      }
    };
  }
}

export const generationService = new GenerationService();
