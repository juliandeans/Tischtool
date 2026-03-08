import type {
  CreateGenerationInput,
  GenerationMode,
  GenerationRuntimeOptions,
  PromptDebugPreview,
  PromptInstructionDebug,
  PromptPresetEffect,
  PromptProtectionRuleDebug
} from '$lib/types/generation';

import {
  buildEnvironmentEditPrompt,
  getEnvironmentModeParameters,
  getEnvironmentPresetEffects,
  getEnvironmentProtectionRules
} from '$lib/server/prompt-builder/modes/environmentEdit';
import {
  buildMaterialEditPrompt,
  getMaterialModeParameters,
  getMaterialProtectionRules
} from '$lib/server/prompt-builder/modes/materialEdit';
import {
  buildRoomInsertPrompt,
  getRoomInsertModeParameters,
  getRoomInsertPresetEffects,
  getRoomInsertProtectionRules
} from '$lib/server/prompt-builder/modes/roomInsert';
import { normalizeUserInstructions } from '$lib/server/prompt-builder/normalizeInstructions';
import { vertexImageService } from '$lib/server/vertex/image';

const MODE_BUILDERS: Record<
  GenerationMode,
  (input: CreateGenerationInput, instructionDebug: PromptInstructionDebug) => string
> = {
  environment_edit: buildEnvironmentEditPrompt,
  material_edit: buildMaterialEditPrompt,
  room_insert: buildRoomInsertPrompt
};

const MODE_LABELS: Record<GenerationMode, string> = {
  environment_edit: 'Umgebung ändern',
  material_edit: 'Material ändern',
  room_insert: 'Raumfoto einsetzen'
};

const COMMON_SYSTEM_LINES = [
  'Arbeite kontrolliert, deterministisch und ohne freie Improvisation für eine plausible Kundenvisualisierung.'
];

const getModePresetEffects = (input: CreateGenerationInput): PromptPresetEffect[] => {
  if (input.mode === 'material_edit') {
    return [];
  }

  return input.mode === 'room_insert'
    ? getRoomInsertPresetEffects(input)
    : getEnvironmentPresetEffects(input);
};

const getModeProtectionRules = (input: CreateGenerationInput): PromptProtectionRuleDebug[] => {
  if (input.mode === 'material_edit') {
    return getMaterialProtectionRules(input);
  }

  return input.mode === 'room_insert'
    ? getRoomInsertProtectionRules(input)
    : getEnvironmentProtectionRules(input);
};

const getModeParameters = (input: CreateGenerationInput) => {
  if (input.mode === 'material_edit') {
    return getMaterialModeParameters(input);
  }

  return input.mode === 'room_insert'
    ? getRoomInsertModeParameters(input)
    : getEnvironmentModeParameters(input);
};

export class PromptBuilder {
  build(input: CreateGenerationInput, runtimeOptions?: GenerationRuntimeOptions) {
    const builder = MODE_BUILDERS[input.mode];
    const instructionDebug = normalizeUserInstructions(input.instructions);
    const promptText = builder(input, instructionDebug);
    const presetEffects = getModePresetEffects(input);
    const protectionRules = getModeProtectionRules(input);
    const modeParameters = getModeParameters(input);
    const systemPromptText = COMMON_SYSTEM_LINES.join('\n');
    const requestPreview = vertexImageService.prepareRequest(input, promptText, runtimeOptions);
    const promptDebug: PromptDebugPreview = {
      mode: input.mode,
      modeLabel: MODE_LABELS[input.mode],
      systemPromptText,
      promptText,
      fullPromptText: promptText,
      presetEffects,
      protectionRules,
      modeParameters,
      instructionDebug,
      requestPreview: {
        provider: requestPreview.provider,
        model: requestPreview.model,
        configured: requestPreview.configured,
        projectId: input.projectId,
        sourceImageId: input.sourceImageId,
        variantsRequested: input.variantsRequested,
        placement: input.placement,
        payload: requestPreview.payload
      }
    };

    return {
      mode: input.mode,
      promptText,
      systemPromptText,
      promptDebug,
      promptFragments: {
        presetEffects,
        protectionRules,
        modeParameters,
        instructionDebug,
        outputGoal: `${input.variantsRequested} Varianten`
      }
    };
  }
}

export const promptBuilder = new PromptBuilder();
