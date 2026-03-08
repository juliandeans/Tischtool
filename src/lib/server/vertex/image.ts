import type { CreateGenerationInput } from '$lib/types/generation';

import { vertexClient } from '$lib/server/vertex/client';

export class VertexImageService {
  prepareRequest(input: CreateGenerationInput, promptText: string) {
    return {
      provider: 'vertex',
      configured: vertexClient.getConfiguration().configured,
      model: vertexClient.getConfiguration().model || 'unconfigured',
      payload: {
        mode: input.mode,
        promptText,
        variantsRequested: input.variantsRequested
      }
    };
  }
}

export const vertexImageService = new VertexImageService();
