import type { CreateGenerationInput, GenerationMode } from '$lib/types/generation';

import { buildEnvironmentEditPrompt } from '$lib/server/prompt-builder/modes/environmentEdit';
import { buildMaterialEditPrompt } from '$lib/server/prompt-builder/modes/materialEdit';
import { buildRoomInsertPrompt } from '$lib/server/prompt-builder/modes/roomInsert';

const MODE_BUILDERS: Record<GenerationMode, (input: CreateGenerationInput) => string> = {
  environment_edit: buildEnvironmentEditPrompt,
  material_edit: buildMaterialEditPrompt,
  room_insert: buildRoomInsertPrompt
};

const COMMON_SYSTEM_LINES = [
  'Das Hauptobjekt muss erhalten bleiben.',
  'Erhalte Perspektive, Maßstab und Konstruktion.',
  'Füge keine zusätzlichen Möbel ohne ausdrückliche Anweisung hinzu.'
];

const MODE_SYSTEM_LINES: Record<GenerationMode, string[]> = {
  environment_edit: ['Ändere primär die Umgebung.'],
  material_edit: [
    'Ändere ausschließlich das Material des Möbels.',
    'Behalte Form, Konstruktion, Perspektive, Hintergrund und Licht möglichst unverändert.'
  ],
  room_insert: [
    'Setze das Möbel plausibel in die Zielregion ein.',
    'Passe Licht und Schatten an das Raumfoto an.'
  ]
};

export class PromptBuilder {
  build(input: CreateGenerationInput) {
    const builder = MODE_BUILDERS[input.mode];

    return {
      mode: input.mode,
      promptText: builder(input),
      systemPromptText: [...COMMON_SYSTEM_LINES, ...MODE_SYSTEM_LINES[input.mode]].join('\n'),
      promptFragments: {
        stylePreset: input.stylePreset,
        lightPreset: input.lightPreset,
        instructions: input.instructions,
        targetMaterial: input.targetMaterial,
        surfaceDescription: input.surfaceDescription,
        preserveObject: input.preserveObject,
        preservePerspective: input.preservePerspective,
        outputGoal: `${input.variantsRequested} Varianten`
      }
    };
  }
}

export const promptBuilder = new PromptBuilder();
