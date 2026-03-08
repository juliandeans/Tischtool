import { eq } from 'drizzle-orm';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { costLogs, generations } from '$lib/server/db/schema';
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

    const prompt = promptBuilder.build({
      ...input,
      placement: normalizedPlacement
    });

    const requestSkeleton = vertexImageService.prepareRequest(input, prompt.promptText);
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
        provider: 'dev-fake',
        model:
          requestSkeleton.model === 'unconfigured' ? `${input.mode}-fake` : requestSkeleton.model,
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
          variantsRequested: input.variantsRequested,
          fakeGeneration: true
        },
        variantsRequested: input.variantsRequested,
        variantsReturned: 0,
        usageJson: {
          fakeGeneration: true,
          requestConfiguredForVertex: requestSkeleton.configured,
          estimatedCost: estimate.estimatedCost,
          unitPrice: estimate.unitPrice
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
            mode: input.mode,
            variantIndex: index,
            placement: normalizedPlacement,
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
              targetMaterial: input.targetMaterial,
              surfaceDescription: input.surfaceDescription,
              placement: normalizedPlacement,
              preserveObject: input.preserveObject,
              preservePerspective: input.preservePerspective,
              variantsRequested: input.variantsRequested
            }
          })
        )
      );

      await db
        .update(generations)
        .set({
          status: 'succeeded',
          variantsReturned: createdImages.length,
          actualCost: String(Number((createdImages.length * estimate.unitPrice).toFixed(4))),
          usageJson: {
            fakeGeneration: true,
            requestConfiguredForVertex: requestSkeleton.configured,
            variantsReturned: createdImages.length,
            actualCost: Number((createdImages.length * estimate.unitPrice).toFixed(4)),
            unitPrice: estimate.unitPrice
          }
        })
        .where(eq(generations.id, generation.id));

      await db.insert(costLogs).values({
        generationId: generation.id,
        provider: 'dev-fake',
        model:
          requestSkeleton.model === 'unconfigured' ? `${input.mode}-fake` : requestSkeleton.model,
        unitType: estimate.unitType,
        quantity: String(createdImages.length),
        unitPrice: String(estimate.unitPrice),
        totalPrice: String(Number((createdImages.length * estimate.unitPrice).toFixed(4))),
        currency: estimate.currency
      });

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
