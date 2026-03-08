import type { PostGenerationResponse } from '$lib/types/api';
import type { CreateGenerationInput } from '$lib/types/generation';

import { promptBuilder } from '$lib/server/prompt-builder';
import { roomPlacementService } from '$lib/server/services/RoomPlacementService';
import { vertexCostEstimationService } from '$lib/server/vertex/cost-estimation';
import { vertexImageService } from '$lib/server/vertex/image';

export class GenerationService {
  async createGeneration(input: CreateGenerationInput): Promise<PostGenerationResponse> {
    const normalizedPlacement = roomPlacementService.normalizePlacement(input.placement);
    const prompt = promptBuilder.build({
      ...input,
      placement: normalizedPlacement
    });

    const requestSkeleton = vertexImageService.prepareRequest(input, prompt.promptText);
    vertexCostEstimationService.estimateVariants(input.variantsRequested);

    return {
      generation: {
        id: crypto.randomUUID(),
        status: requestSkeleton.configured ? 'pending' : 'pending',
        variantsReturned: 0
      },
      images: []
    };
  }
}

export const generationService = new GenerationService();
