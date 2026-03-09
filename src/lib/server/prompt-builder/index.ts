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
  buildEnvironmentEditPromptGemini,
  getEnvironmentModeParameters,
  getEnvironmentPresetEffects,
  getEnvironmentProtectionRules
} from '$lib/server/prompt-builder/modes/environmentEdit';
import {
  buildGeminiImageEditPayload,
  GEMINI_IMAGE_MODEL,
  getGeminiGenerateContentUrl
} from '$lib/server/vertex/gemini-image';
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
import type { ImageModel } from '$lib/types/settings';
import { vertexImageService } from '$lib/server/vertex/image';
import { vertexClient } from '$lib/server/vertex/client';

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

const getActiveImageModel = (runtimeOptions?: GenerationRuntimeOptions): ImageModel =>
  runtimeOptions?.imageModel === 'gemini-3-pro-image' ? 'gemini-3-pro-image' : 'imagen-3';

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
    const activeImageModel = getActiveImageModel(runtimeOptions);
    const builder =
      input.mode === 'environment_edit' && activeImageModel === 'gemini-3-pro-image'
        ? buildEnvironmentEditPromptGemini
        : MODE_BUILDERS[input.mode];
    const instructionDebug = normalizeUserInstructions(input.instructions);
    const promptText = builder(input, instructionDebug);
    const presetEffects = getModePresetEffects(input);
    const protectionRules = getModeProtectionRules(input);
    const modeParameters = getModeParameters(input);
    const systemPromptText = COMMON_SYSTEM_LINES.join('\n');
    const requestPreview = vertexImageService.prepareRequest(input, promptText, runtimeOptions);
    const requestPreviewWithModel =
      input.mode === 'environment_edit' && activeImageModel === 'gemini-3-pro-image'
        ? {
            ...requestPreview,
            model: GEMINI_IMAGE_MODEL,
            payload: buildGeminiImageEditPayload({
              sourceImageBase64: '<omitted-base64-image>',
              sourceImageMimeType: 'image/png',
              promptText
            }),
            providerDebug: {
              ...requestPreview.providerDebug,
              model: GEMINI_IMAGE_MODEL,
              requestType: 'generate' as const,
              requestEndpoint: 'generateContent' as const,
              endpointUrl: getGeminiGenerateContentUrl(vertexClient.getConfiguration().projectId),
              maskIncluded: false,
              requestBody: buildGeminiImageEditPayload({
                sourceImageBase64: '<omitted-base64-image>',
                sourceImageMimeType: 'image/png',
                promptText
              }),
              providerParameters: {
                responseModalities: ['TEXT', 'IMAGE'],
                outputMimeType: 'image/png',
                variantsRequested: input.variantsRequested
              }
            }
          }
        : requestPreview;
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
        model: requestPreviewWithModel.model,
        configured: requestPreviewWithModel.configured,
        projectId: input.projectId,
        sourceImageId: input.sourceImageId,
        variantsRequested: input.variantsRequested,
        placement: input.placement,
        payload: requestPreviewWithModel.payload
      },
      providerDebug: {
        request: requestPreviewWithModel.providerDebug,
        run: null
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
