import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { PostGenerationRequest, PostGenerationResponse } from '$lib/types/api';
import type { GenerationMode } from '$lib/types/generation';
import { generationService } from '$lib/server/services/GenerationService';

const isGenerationMode = (value: string): value is GenerationMode =>
  value === 'environment_edit' || value === 'material_edit' || value === 'room_insert';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as Partial<PostGenerationRequest>;

  if (
    !body.projectId ||
    !body.sourceImageId ||
    typeof body.mode !== 'string' ||
    !isGenerationMode(body.mode)
  ) {
    return json({ error: 'projectId, sourceImageId and valid mode are required' }, { status: 400 });
  }

  if (typeof body.variantsRequested !== 'number' || body.variantsRequested < 1) {
    return json({ error: 'variantsRequested must be a positive number' }, { status: 400 });
  }

  if (body.mode !== 'environment_edit') {
    return json({ error: 'Only environment_edit is implemented in Phase 4.' }, { status: 501 });
  }

  try {
    const response = await generationService.createGeneration({
      projectId: body.projectId,
      sourceImageId: body.sourceImageId,
      mode: body.mode,
      variantsRequested: body.variantsRequested,
      stylePreset: body.stylePreset ?? 'original',
      lightPreset: body.lightPreset ?? 'original',
      instructions: body.instructions ?? '',
      preserveObject: body.preserveObject ?? true,
      preservePerspective: body.preservePerspective ?? true,
      placement: body.placement ?? null
    });

    const apiResponse: PostGenerationResponse = response;

    return json(apiResponse, { status: 201 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Generation failed.'
      },
      { status: 500 }
    );
  }
};
