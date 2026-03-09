import type {
  CreateGenerationInput,
  GenerationMode,
  GenerationRuntimeOptions,
  PromptDebugEntry,
  PromptDebugPreview,
  PromptInstructionDebug,
  PromptPresetEffect,
  PromptProtectionRuleDebug,
  ProtectionRules,
  RoomPreset
} from '$lib/types/generation';

import { normalizeUserInstructions } from '$lib/server/prompt-builder/normalizeInstructions';
import {
  ROOM_PRESET_LABELS,
  ROOM_PRESET_PROMPTS
} from '$lib/server/prompt-builder/roomPresets';
import { DEFAULT_PROTECTION_RULES as DEFAULT_RULES } from '$lib/types/generation';
import { getEnvironmentModeParameters } from '$lib/server/prompt-builder/modes/environmentEdit';
import { getMaterialModeParameters } from '$lib/server/prompt-builder/modes/materialEdit';
import { getRoomPlacementModeParameters } from '$lib/server/prompt-builder/modes/roomInsert';
import {
  buildGeminiImageEditPayload,
  GEMINI_IMAGE_MODEL,
  getGeminiGenerateContentUrl
} from '$lib/server/vertex/gemini-image';
import { vertexClient } from '$lib/server/vertex/client';
import { vertexImageService } from '$lib/server/vertex/image';

const MODE_LABELS: Record<GenerationMode, string> = {
  environment_edit: 'Umgebung',
  material_edit: 'Stück modellieren',
  room_placement: 'Stück platzieren'
};

const STYLE_PRESET_LABELS = {
  original: 'Original',
  minimal: 'Minimal',
  warm: 'Warm',
  modern: 'Modern'
} as const;

const LIGHT_PRESET_LABELS = {
  original: 'Original',
  warm: 'Warm',
  bright: 'Hell',
  dramatic: 'Dramatisch'
} as const;

const RULE_LABELS: Record<keyof ProtectionRules, string> = {
  preserveObject: 'Objekt erhalten',
  preservePerspective: 'Perspektive erhalten',
  preserveCrop: 'Bildausschnitt möglichst erhalten',
  noExtraFurniture: 'Keine zusätzlichen Möbel',
  changesOnlyEnvironment: 'Änderungen primär an der Umgebung'
};

const PREVIEW_MODE_PARAMETERS: Record<GenerationMode, (input: CreateGenerationInput) => PromptDebugEntry[]> =
  {
    environment_edit: getEnvironmentModeParameters,
    material_edit: getMaterialModeParameters,
    room_placement: getRoomPlacementModeParameters
  };

const trimLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const buildSection = (title: string, lines: string[]) =>
  lines.length > 0 ? `${title}\n${lines.join('\n')}` : '';

const getResolvedUserInput = (input: CreateGenerationInput) => input.userInput ?? input.instructions ?? '';

const getResolvedRoomPreset = (input: CreateGenerationInput): RoomPreset => input.roomPreset ?? 'none';

const getResolvedProtectionRules = (input: CreateGenerationInput): ProtectionRules => ({
  ...DEFAULT_RULES,
  ...input.protectionRules,
  preserveObject: input.protectionRules?.preserveObject ?? input.preserveObject ?? DEFAULT_RULES.preserveObject,
  preservePerspective:
    input.protectionRules?.preservePerspective ??
    input.preservePerspective ??
    DEFAULT_RULES.preservePerspective
});

function buildHeader(mode: GenerationMode): string {
  if (mode === 'room_placement') {
    return [
      'Du erhältst ein Bild eines Möbelstücks. Platziere dieses Möbelstück',
      'photorealistisch in folgendem Raumkontext:'
    ].join('\n');
  }

  return 'Du bearbeitest ein Innenraum-Foto mit einem Möbelstück.';
}

function buildFooter(): string {
  return 'Photorealistisches Interieur-Foto.';
}

function buildPreserveBlock(mode: GenerationMode, rules: ProtectionRules): string {
  if (mode === 'room_placement') {
    return '';
  }

  if (mode === 'material_edit') {
    return buildSection('Behalte unverändert:', [
      'Die gesamte Raumsituation exakt – Wand, Boden, Dekoration, Licht, Perspektive und Bildausschnitt.'
    ]);
  }

  const lines = [
    rules.preserveObject ? 'Das Möbelstück exakt – Struktur, Form, Material, Oberfläche.' : null,
    rules.preservePerspective ? 'Perspektive und Kamerawinkel.' : null,
    rules.preserveCrop ? 'Den Bildausschnitt vollständig.' : null,
    rules.noExtraFurniture ? 'Füge keine weiteren Möbel hinzu.' : null,
    rules.changesOnlyEnvironment ? 'Ändere ausschließlich Wand, Boden, Licht und Atmosphäre.' : null
  ].filter((line): line is string => Boolean(line));

  return buildSection('Behalte unverändert:', lines);
}

function buildChangeBlock(
  mode: GenerationMode,
  userInput: string,
  roomPreset: RoomPreset,
  stylePreset: CreateGenerationInput['stylePreset'],
  lightPreset: CreateGenerationInput['lightPreset']
): string {
  const lines: string[] = [];
  const roomPresetPrompt = ROOM_PRESET_PROMPTS[roomPreset];

  if (mode === 'room_placement') {
    if (roomPreset === 'none' || !roomPresetPrompt) {
      throw new Error("Für 'Stück platzieren' muss ein Raum-Preset gewählt werden.");
    }

    lines.push(roomPresetPrompt);

    if (stylePreset !== 'original') {
      lines.push(`Stil: ${STYLE_PRESET_LABELS[stylePreset]}`);
    }

    if (lightPreset !== 'original') {
      lines.push(`Licht: ${LIGHT_PRESET_LABELS[lightPreset]}`);
    }

    const userLines = trimLines(userInput);

    if (userLines.length > 0) {
      lines.push(`Zusätzliche Anforderungen:\n${userLines.join('\n')}`);
    }

    lines.push(
      'Das Möbelstück soll natürlich im Raum wirken, mit realistischen',
      'Schatten und zur Szene passender Beleuchtung.'
    );

    return buildSection('Ändere folgende Aspekte:', lines);
  }

  if (mode === 'material_edit') {
    const userLines = trimLines(userInput);
    const materialLines =
      userLines.length > 0 ? userLines : ['Material und Oberflächenwirkung des Möbelstücks.'];

    if (stylePreset !== 'original') {
      materialLines.push(`Stil: ${STYLE_PRESET_LABELS[stylePreset]}`);
    }

    return buildSection('Ändere folgende Aspekte am Möbelstück:', materialLines);
  }

  if (roomPresetPrompt) {
    lines.push(roomPresetPrompt);
  }

  if (stylePreset !== 'original') {
    lines.push(`Stil: ${STYLE_PRESET_LABELS[stylePreset]}`);
  }

  if (lightPreset !== 'original') {
    lines.push(`Licht: ${LIGHT_PRESET_LABELS[lightPreset]}`);
  }

  lines.push(...trimLines(userInput));

  return buildSection('Ändere folgende Aspekte:', lines);
}

const getVisibleProtectionRules = (
  input: CreateGenerationInput,
  mode: GenerationMode
): PromptProtectionRuleDebug[] => {
  const rules = getResolvedProtectionRules(input);

  if (mode === 'room_placement') {
    return [];
  }

  const keys: Array<keyof ProtectionRules> =
    mode === 'material_edit'
      ? ['preserveObject', 'preservePerspective', 'preserveCrop', 'noExtraFurniture']
      : [
          'preserveObject',
          'preservePerspective',
          'preserveCrop',
          'noExtraFurniture',
          'changesOnlyEnvironment'
        ];

  return keys.map((key) => ({
    key,
    label: RULE_LABELS[key],
    enabled: rules[key],
    appliedFragment: rules[key] ? RULE_LABELS[key] : null
  }));
};

const getPresetEffects = (input: CreateGenerationInput): PromptPresetEffect[] => {
  const effects: PromptPresetEffect[] = [];
  const roomPreset = getResolvedRoomPreset(input);

  if (roomPreset !== 'none') {
    effects.push({
      label: 'Raumkontext',
      value: ROOM_PRESET_LABELS[roomPreset],
      appliedFragment: ROOM_PRESET_PROMPTS[roomPreset] ?? ''
    });
  }

  if (input.stylePreset !== 'original') {
    effects.push({
      label: 'Stil-Preset',
      value: input.stylePreset,
      appliedFragment: `Stil: ${STYLE_PRESET_LABELS[input.stylePreset]}`
    });
  }

  if (input.mode !== 'material_edit' && input.lightPreset !== 'original') {
    effects.push({
      label: 'Licht-Preset',
      value: input.lightPreset,
      appliedFragment: `Licht: ${LIGHT_PRESET_LABELS[input.lightPreset]}`
    });
  }

  return effects;
};

const createPromptText = (input: CreateGenerationInput): string => {
  const roomPreset = getResolvedRoomPreset(input);
  const protectionRules = getResolvedProtectionRules(input);
  const userInput = getResolvedUserInput(input);
  const blocks = [
    buildHeader(input.mode),
    buildPreserveBlock(input.mode, protectionRules),
    buildChangeBlock(
      input.mode,
      userInput,
      roomPreset,
      input.stylePreset,
      input.lightPreset
    ),
    buildFooter()
  ].filter(Boolean);

  return blocks.join('\n\n');
};

export class PromptBuilder {
  build(input: CreateGenerationInput, runtimeOptions?: GenerationRuntimeOptions) {
    const normalizedInput: CreateGenerationInput = {
      ...input,
      userInput: getResolvedUserInput(input),
      roomPreset: getResolvedRoomPreset(input),
      protectionRules: getResolvedProtectionRules(input)
    };
    const resolvedUserInput = normalizedInput.userInput ?? '';
    const instructionDebug: PromptInstructionDebug = normalizeUserInstructions(resolvedUserInput);
    const promptText = createPromptText(normalizedInput);
    const presetEffects = getPresetEffects(normalizedInput);
    const protectionRules = getVisibleProtectionRules(normalizedInput, normalizedInput.mode);
    const modeParameters = PREVIEW_MODE_PARAMETERS[normalizedInput.mode](normalizedInput);
    const requestPreview = vertexImageService.prepareRequest(normalizedInput, promptText, runtimeOptions);
    const requestPreviewWithModel =
      runtimeOptions?.imageModel === 'gemini-3-pro-image' &&
      normalizedInput.mode === 'environment_edit'
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
                variantsRequested: normalizedInput.variantsRequested
              }
            }
          }
        : requestPreview;

    const promptDebug: PromptDebugPreview = {
      mode: normalizedInput.mode,
      modeLabel: MODE_LABELS[normalizedInput.mode],
      systemPromptText: '',
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
        projectId: normalizedInput.projectId,
        sourceImageId: normalizedInput.sourceImageId,
        variantsRequested: normalizedInput.variantsRequested,
        placement: normalizedInput.placement,
        payload: requestPreviewWithModel.payload
      },
      providerDebug: {
        request: requestPreviewWithModel.providerDebug,
        run: null
      }
    };

    return {
      mode: normalizedInput.mode,
      promptText,
      systemPromptText: '',
      promptDebug,
      promptFragments: {
        presetEffects,
        protectionRules,
        modeParameters,
        instructionDebug,
        outputGoal: `${normalizedInput.variantsRequested} Varianten`
      }
    };
  }
}

export const promptBuilder = new PromptBuilder();
