import type {
  CreateGenerationInput,
  GenerationMode,
  GenerationRuntimeOptions,
  MaterialEditSubMode,
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
  GEMINI_25_FLASH_IMAGE_MODEL,
  GEMINI_FLASH_IMAGE_MODEL,
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

type RoomPlacementPromptPlacement = NonNullable<CreateGenerationInput['placement']> & {
  roomImageWidth?: number | null;
  roomImageHeight?: number | null;
};

const getResolvedUserInput = (input: CreateGenerationInput) => input.userInput ?? input.instructions ?? '';

const getResolvedRoomPreset = (input: CreateGenerationInput): RoomPreset => input.roomPreset ?? 'none';

const getResolvedMaterialEditSubMode = (
  input: CreateGenerationInput
): MaterialEditSubMode => input.materialEditSubMode ?? 'surface';

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

function buildMaterialPreserveBlock(subMode: MaterialEditSubMode): string {
  if (subMode === 'form') {
    return buildSection('Behalte unverändert:', [
      'Die gesamte Raumsituation exakt – Wand, Boden, Dekoration, Licht',
      'und Perspektive.',
      'Das Material und die Oberfläche des Möbelstücks.'
    ]);
  }

  if (subMode === 'style') {
    return buildSection('Behalte unverändert:', [
      'Die gesamte Raumsituation exakt – Wand, Boden, Dekoration, Licht',
      'und Perspektive.',
      'Die grundlegende Funktion des Möbelstücks.'
    ]);
  }

  return buildSection('Behalte unverändert:', [
    'Die gesamte Raumsituation exakt – Wand, Boden, Dekoration, Licht,',
    'Perspektive und Bildausschnitt.',
    'Die Form, Struktur und Proportionen des Möbelstücks exakt.'
  ]);
}

function buildChangeBlock(
  mode: GenerationMode,
  userInput: string,
  roomPreset: RoomPreset,
  stylePreset: CreateGenerationInput['stylePreset'],
  lightPreset: CreateGenerationInput['lightPreset'],
  materialEditSubMode: MaterialEditSubMode
): string {
  const lines: string[] = [];
  const roomPresetPrompt = ROOM_PRESET_PROMPTS[roomPreset];

  if (mode === 'room_placement') {
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
    if (materialEditSubMode === 'form') {
      return [
        buildSection('Ändere die Form und Proportionen des Möbelstücks:', userLines),
        'Passe Perspektive und Bildausschnitt nur so weit an, wie es für',
        'eine realistische Darstellung der neuen Form nötig ist.'
      ].join('\n');
    }

    if (materialEditSubMode === 'style') {
      return [
        'Interpretiere das Möbelstück in folgendem Designstil neu',
        '(Form und Oberfläche dürfen sich verändern):',
        ...userLines
      ].join('\n');
    }

    return buildSection('Ändere folgende Aspekte am Möbelstück:', userLines);
  }

  const userLines = trimLines(userInput);
  const hasRoomContext = Boolean(roomPresetPrompt);
  const hasStylePreset = stylePreset !== 'original';
  const hasLightPreset = lightPreset !== 'original';
  const hasUserInput = userLines.length > 0;
  const shouldPrioritizeUserInput = hasRoomContext && hasUserInput;

  if (hasRoomContext) {
    lines.push(roomPresetPrompt as string);
  }

  if (hasStylePreset) {
    lines.push(`Stil: ${STYLE_PRESET_LABELS[stylePreset]}`);
  }

  if (hasLightPreset) {
    lines.push(`Licht: ${LIGHT_PRESET_LABELS[lightPreset]}`);
  }

  if (shouldPrioritizeUserInput) {
    lines.push('Individuelle Anpassungen (haben Vorrang vor dem Raumkontext):');
    lines.push(...userLines);
  } else if (hasUserInput) {
    lines.push(...userLines);
  }

  return buildSection('Ändere folgende Aspekte:', lines);
}

const getRoomPlacementPercent = (value: number, size: number | null) => {
  if (!size || size <= 0) {
    return Math.max(0, Math.round(value));
  }

  return Math.max(0, Math.min(100, Math.round((value / size) * 100)));
};

const getRoomPlacementPercentages = (input: CreateGenerationInput) => {
  if (input.mode !== 'room_placement' || !input.placement) {
    return null;
  }

  const placement = input.placement as RoomPlacementPromptPlacement;
  const roomImageWidth =
    typeof placement.roomImageWidth === 'number' && placement.roomImageWidth > 0
      ? placement.roomImageWidth
      : null;
  const roomImageHeight =
    typeof placement.roomImageHeight === 'number' && placement.roomImageHeight > 0
      ? placement.roomImageHeight
      : null;

  return {
    x: getRoomPlacementPercent(placement.x, roomImageWidth),
    y: getRoomPlacementPercent(placement.y, roomImageHeight),
    width: getRoomPlacementPercent(placement.width, roomImageWidth)
  };
};

const createRoomPlacementPromptText = (input: CreateGenerationInput): string => {
  const userLines = trimLines(getResolvedUserInput(input));
  const percentages = getRoomPlacementPercentages(input);
  const blocks = [
    [
      'Du erhältst zwei Bilder:',
      'Bild 1: Ein freigestelltes Möbelstück vor neutralem Hintergrund.',
      'Bild 2: Ein Raumfoto.'
    ].join('\n'),
    ['Platziere das Möbelstück aus Bild 1 photorealistisch in den Raum', 'aus Bild 2.'].join(
      '\n'
    ),
    [
      `Zielposition im Raum: ca. ${percentages?.x ?? 0}% von links, ${percentages?.y ?? 0}% von oben,`,
      `Breite ca. ${percentages?.width ?? 0}% der Bildbreite.`
    ].join('\n'),
    [
      'Das Ausgabebild muss exakt dasselbe Seitenverhältnis und dieselbe',
      'Bildgröße wie Bild 2 haben. Kein Zuschneiden, kein Beschneiden,',
      'keine Formatänderung, keine Rotation.'
    ].join('\n'),
    [
      'Behalte unverändert:',
      'Den Raum aus Bild 2 exakt – Wände, Boden, Decke, Licht, Perspektive,',
      'alle vorhandenen Möbel und Dekorationen.'
    ].join('\n'),
    [
      'Das Möbelstück soll natürlich wirken: realistische Schatten,',
      'korrekte Perspektive, zur Szene passende Beleuchtung.'
    ].join('\n'),
    input.stylePreset !== 'original' ? `Stil: ${STYLE_PRESET_LABELS[input.stylePreset]}` : '',
    input.lightPreset !== 'original' ? `Licht: ${LIGHT_PRESET_LABELS[input.lightPreset]}` : '',
    userLines.length > 0 ? ['Zusätzliche Wünsche:', ...userLines].join('\n') : '',
    buildFooter()
  ].filter(Boolean);

  return blocks.join('\n\n');
};

const getVisibleProtectionRules = (
  input: CreateGenerationInput,
  mode: GenerationMode
): PromptProtectionRuleDebug[] => {
  if (mode === 'room_placement' || mode === 'material_edit') {
    return [];
  }

  const rules = getResolvedProtectionRules(input);
  const keys: Array<keyof ProtectionRules> = [
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

  if (input.mode === 'material_edit') {
    return effects;
  }

  const roomPreset = getResolvedRoomPreset(input);

  if (input.mode !== 'room_placement' && roomPreset !== 'none') {
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

  if (input.lightPreset !== 'original') {
    effects.push({
      label: 'Licht-Preset',
      value: input.lightPreset,
      appliedFragment: `Licht: ${LIGHT_PRESET_LABELS[input.lightPreset]}`
    });
  }

  return effects;
};

const createPromptText = (input: CreateGenerationInput): string => {
  if (input.mode === 'room_placement') {
    return createRoomPlacementPromptText(input);
  }

  const roomPreset = getResolvedRoomPreset(input);
  const protectionRules = getResolvedProtectionRules(input);
  const userInput = getResolvedUserInput(input);
  const materialEditSubMode = getResolvedMaterialEditSubMode(input);
  const blocks = [
    buildHeader(input.mode),
    input.mode === 'material_edit'
      ? buildMaterialPreserveBlock(materialEditSubMode)
      : buildPreserveBlock(input.mode, protectionRules),
    buildChangeBlock(
      input.mode,
      userInput,
      roomPreset,
      input.stylePreset,
      input.lightPreset,
      materialEditSubMode
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
      materialEditSubMode: getResolvedMaterialEditSubMode(input),
      protectionRules: getResolvedProtectionRules(input)
    };
    const resolvedUserInput = normalizedInput.userInput ?? '';
    const instructionDebug: PromptInstructionDebug = normalizeUserInstructions(resolvedUserInput);
    const promptText = createPromptText(normalizedInput);
    const presetEffects = getPresetEffects(normalizedInput);
    const protectionRules = getVisibleProtectionRules(normalizedInput, normalizedInput.mode);
    const modeParameters = PREVIEW_MODE_PARAMETERS[normalizedInput.mode](normalizedInput);
    const requestPreview = vertexImageService.prepareRequest(normalizedInput, promptText, runtimeOptions);
    const geminiModelId =
      runtimeOptions?.imageModel === 'gemini-3.1-flash-image-preview'
        ? GEMINI_FLASH_IMAGE_MODEL
        : runtimeOptions?.imageModel === 'gemini-2.5-flash-image-preview'
          ? GEMINI_25_FLASH_IMAGE_MODEL
        : runtimeOptions?.imageModel === 'gemini-3-pro-image'
          ? GEMINI_IMAGE_MODEL
          : null;
    const requestPreviewWithModel =
      geminiModelId &&
      (normalizedInput.mode === 'environment_edit' || normalizedInput.mode === 'room_placement')
        ? {
            ...requestPreview,
            model: geminiModelId,
            payload: buildGeminiImageEditPayload({
              sourceImageBase64: '<omitted-base64-image>',
              sourceImageMimeType: 'image/png',
              secondaryImageBase64:
                normalizedInput.mode === 'room_placement' && normalizedInput.placement
                  ? '<omitted-base64-image>'
                  : undefined,
              secondaryImageMimeType:
                normalizedInput.mode === 'room_placement' && normalizedInput.placement
                  ? 'image/png'
                  : undefined,
              promptText
            }),
            providerDebug: {
              ...requestPreview.providerDebug,
              model: geminiModelId,
              requestType: 'generate' as const,
              requestEndpoint: 'generateContent' as const,
              endpointUrl: getGeminiGenerateContentUrl(
                vertexClient.getConfiguration().projectId,
                geminiModelId
              ),
              maskIncluded: false,
              targetRegionIncluded: false,
              requestBody: buildGeminiImageEditPayload({
                sourceImageBase64: '<omitted-base64-image>',
                sourceImageMimeType: 'image/png',
                secondaryImageBase64:
                  normalizedInput.mode === 'room_placement' && normalizedInput.placement
                    ? '<omitted-base64-image>'
                    : undefined,
                secondaryImageMimeType:
                  normalizedInput.mode === 'room_placement' && normalizedInput.placement
                    ? 'image/png'
                    : undefined,
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
      modeLabel:
        normalizedInput.mode === 'material_edit'
          ? `${MODE_LABELS[normalizedInput.mode]} / ${normalizedInput.materialEditSubMode}`
          : MODE_LABELS[normalizedInput.mode],
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
