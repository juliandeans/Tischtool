import { eq } from 'drizzle-orm';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import type { PostGenerationResponse } from '$lib/types/api';
import type { CreateGenerationInput } from '$lib/types/generation';

import { promptBuilder } from '$lib/server/prompt-builder';
import { imageService } from '$lib/server/services/ImageService';
import { roomPlacementService } from '$lib/server/services/RoomPlacementService';
import { vertexCostEstimationService } from '$lib/server/vertex/cost-estimation';
import { vertexImageService } from '$lib/server/vertex/image';

export class GenerationService {
  async createGeneration(input: CreateGenerationInput): Promise<PostGenerationResponse> {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    if (input.mode !== 'environment_edit') {
      throw new Error('Only environment_edit is implemented in Phase 4.');
    }

    const normalizedPlacement = roomPlacementService.normalizePlacement(input.placement);
    const sourceImage = await imageService.getImage(input.sourceImageId);

    if (sourceImage.projectId !== input.projectId) {
      throw new Error('Source image does not belong to the provided project.');
    }

    const prompt = promptBuilder.build({
      ...input,
      placement: normalizedPlacement
    });

    const requestSkeleton = vertexImageService.prepareRequest(input, prompt.promptText);
    const estimate = vertexCostEstimationService.estimateVariants(input.variantsRequested);
    const db = getDb();

    const [generation] = await db
      .insert(generations)
      .values({
        projectId: input.projectId,
        userId: sourceImage.userId,
        sourceImageId: sourceImage.id,
        provider: 'dev-fake',
        model:
          requestSkeleton.model === 'unconfigured'
            ? 'environment-edit-fake'
            : requestSkeleton.model,
        mode: input.mode,
        promptText: prompt.promptText,
        systemPromptText: prompt.systemPromptText,
        settingsJson: {
          stylePreset: input.stylePreset,
          lightPreset: input.lightPreset,
          instructions: input.instructions,
          preserveObject: input.preserveObject,
          preservePerspective: input.preservePerspective,
          fakeGeneration: true
        },
        variantsRequested: input.variantsRequested,
        variantsReturned: 0,
        usageJson: {
          fakeGeneration: true,
          requestConfiguredForVertex: requestSkeleton.configured
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
      const createdImages = await Promise.all(
        Array.from({ length: input.variantsRequested }, (_, index) =>
          imageService.createGeneratedVariant({
            sourceImageId: sourceImage.id,
            generationId: generation.id,
            variantIndex: index,
            promptSnapshot: {
              mode: input.mode,
              systemPromptText: prompt.systemPromptText,
              promptText: prompt.promptText,
              promptFragments: prompt.promptFragments
            },
            settingsSnapshot: {
              stylePreset: input.stylePreset,
              lightPreset: input.lightPreset,
              instructions: input.instructions,
              preserveObject: input.preserveObject,
              preservePerspective: input.preservePerspective
            }
          })
        )
      );

      await db
        .update(generations)
        .set({
          status: 'succeeded',
          variantsReturned: createdImages.length,
          usageJson: {
            fakeGeneration: true,
            requestConfiguredForVertex: requestSkeleton.configured,
            variantsReturned: createdImages.length
          }
        })
        .where(eq(generations.id, generation.id));

      return {
        generation: {
          id: generation.id,
          status: 'succeeded',
          variantsReturned: createdImages.length
        },
        images: createdImages.map((image) => ({
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
            fakeGeneration: true,
            error: error instanceof Error ? error.message : 'unknown error'
          }
        })
        .where(eq(generations.id, generation.id));

      throw error;
    }
  }
}

export const generationService = new GenerationService();
