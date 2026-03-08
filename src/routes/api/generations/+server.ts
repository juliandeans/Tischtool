import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { PostGenerationRequest, PostGenerationResponse } from '$lib/types/api';
import { readProviderDebugEnabled, readProviderPreference } from '$lib/server/provider-settings';
import { createDebugRunId } from '$lib/server/vertex/debug';
import type { GenerationMode } from '$lib/types/generation';
import { generationService } from '$lib/server/services/GenerationService';

const isGenerationMode = (value: string): value is GenerationMode =>
  value === 'environment_edit' || value === 'material_edit' || value === 'room_insert';

const readProtectionRules = (value: unknown) =>
  value && typeof value === 'object' ? (value as Record<string, boolean>) : undefined;

export const POST: RequestHandler = async ({ request, cookies }) => {
  const debugRunId = createDebugRunId();
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

  try {
    const response = await generationService.createGeneration(
      {
        projectId: body.projectId,
        sourceImageId: body.sourceImageId,
        mode: body.mode,
        variantsRequested: body.variantsRequested,
        stylePreset: body.stylePreset ?? 'original',
        lightPreset: body.lightPreset ?? 'original',
        instructions: body.instructions ?? '',
        targetMaterial: typeof body.targetMaterial === 'string' ? body.targetMaterial : null,
        surfaceDescription: body.surfaceDescription ?? '',
        preserveObject: body.preserveObject ?? true,
        preservePerspective: body.preservePerspective ?? true,
        placement: body.placement ?? null,
        protectionRules: readProtectionRules(body.protectionRules)
      },
      {
        providerPreference: readProviderPreference(cookies),
        providerDebugEnabled: readProviderDebugEnabled(cookies),
        debugRunId
      }
    );

    const apiResponse: PostGenerationResponse = response;

    return json(apiResponse, { status: 201 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Generation failed.',
        details: {
          requestId: debugRunId
        }
      },
      { status: 500 }
    );
  }
};
