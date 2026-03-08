import type { CreateGenerationInput, GenerationMode } from '$lib/types/generation';

import { buildEnvironmentEditPrompt } from '$lib/server/prompt-builder/modes/environmentEdit';
import { buildMaterialEditPrompt } from '$lib/server/prompt-builder/modes/materialEdit';
import { buildRoomInsertPrompt } from '$lib/server/prompt-builder/modes/roomInsert';

const MODE_BUILDERS: Record<GenerationMode, (input: CreateGenerationInput) => string> = {
  environment_edit: buildEnvironmentEditPrompt,
  material_edit: buildMaterialEditPrompt,
  room_insert: buildRoomInsertPrompt
};

export class PromptBuilder {
  build(input: CreateGenerationInput) {
    const builder = MODE_BUILDERS[input.mode];

    return {
      mode: input.mode,
      promptText: builder(input),
      systemPromptText:
        'Preserve the main furniture object. Keep the result plausible, consistent and production-ready.',
      promptFragments: {
        stylePreset: input.stylePreset,
        lightPreset: input.lightPreset,
        instructions: input.instructions
      }
    };
  }
}

export const promptBuilder = new PromptBuilder();
