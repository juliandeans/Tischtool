import type {
  CreateGenerationInput,
  PromptDebugEntry,
  PromptPresetEffect,
  PromptProtectionRuleDebug,
  ProtectionRuleKey
} from '$lib/types/generation';

const STYLE_PRESET_FRAGMENTS: Record<string, string> = {
  original: 'Behalte die vorhandene Stilwirkung des Raums weitgehend bei.',
  editorial: 'Wirke ruhig, klar und präsentationsfähig.',
  wohnlich: 'Wirke warm, wohnlich und einladend.'
};

const LIGHT_PRESET_FRAGMENTS: Record<string, string> = {
  original: 'Behalte die vorhandene Lichtsituation weitgehend bei.',
  tageslicht: 'Nutze freundliches Tageslicht für eine glaubwürdige Raumwirkung.',
  abendlicht: 'Nutze warmes, weiches Abendlicht für eine wohnliche Kundenvisualisierung.'
};

type RoomInsertRuleDefinition = {
  key: ProtectionRuleKey;
  label: string;
  enabledFragment: string;
  disabledFragment: string | null;
};

const ROOM_INSERT_RULES: RoomInsertRuleDefinition[] = [
  {
    key: 'preserveObject',
    label: 'Objekt erhalten',
    enabledFragment: 'Das Möbel soll Form, Proportion und Konstruktion behalten.',
    disabledFragment: 'Das Möbel darf nur minimal an die Einbausituation angepasst werden.'
  },
  {
    key: 'preservePerspective',
    label: 'Perspektive erhalten',
    enabledFragment:
      'Erhalte die Perspektive des Möbels und passe sie plausibel an die Raumansicht an.',
    disabledFragment: 'Perspektivische Anpassungen sind nur vorsichtig erlaubt.'
  },
  {
    key: 'noExtraFurniture',
    label: 'Keine zusätzlichen Möbel',
    enabledFragment: 'Füge keine weiteren Möbel hinzu.',
    disabledFragment: 'Weitere Möbel sind nur erlaubt, wenn sie ausdrücklich verlangt werden.'
  },
  {
    key: 'adaptLighting',
    label: 'Licht und Schatten anpassen',
    enabledFragment:
      'Passe Licht und Schatten so an, dass das Ergebnis wie eine glaubwürdige Kundenvisualisierung wirkt.',
    disabledFragment: 'Halte Licht und Schatten möglichst neutral und zurückhaltend.'
  }
];

const getRuleState = (input: CreateGenerationInput, key: ProtectionRuleKey) => {
  if (typeof input.protectionRules?.[key] === 'boolean') {
    return input.protectionRules[key] as boolean;
  }

  if (key === 'preserveObject') {
    return input.preserveObject;
  }

  if (key === 'preservePerspective') {
    return input.preservePerspective;
  }

  return true;
};

export const getRoomInsertPresetEffects = (input: CreateGenerationInput): PromptPresetEffect[] => {
  const styleValue = STYLE_PRESET_FRAGMENTS[input.stylePreset] ? input.stylePreset : 'original';
  const lightValue = LIGHT_PRESET_FRAGMENTS[input.lightPreset] ? input.lightPreset : 'original';

  return [
    {
      label: 'Stil-Preset',
      value: styleValue,
      appliedFragment: STYLE_PRESET_FRAGMENTS[styleValue]
    },
    {
      label: 'Licht-Preset',
      value: lightValue,
      appliedFragment: LIGHT_PRESET_FRAGMENTS[lightValue]
    }
  ];
};

export const getRoomInsertProtectionRules = (
  input: CreateGenerationInput
): PromptProtectionRuleDebug[] =>
  ROOM_INSERT_RULES.map((rule) => {
    const enabled = getRuleState(input, rule.key);

    return {
      key: rule.key,
      label: rule.label,
      enabled,
      appliedFragment: enabled ? rule.enabledFragment : rule.disabledFragment
    };
  });

export const getRoomInsertModeParameters = (input: CreateGenerationInput): PromptDebugEntry[] => [
  { label: 'Modus', value: 'Raumfoto einsetzen' },
  { label: 'Varianten', value: String(input.variantsRequested) },
  { label: 'Möbelbild-ID', value: input.sourceImageId },
  {
    label: 'Raumfoto-ID',
    value: input.placement?.roomImageId ?? 'noch nicht gewählt'
  },
  {
    label: 'Zielregion',
    value: input.placement
      ? `${input.placement.x}, ${input.placement.y} · ${input.placement.width} × ${input.placement.height}`
      : 'noch nicht gesetzt'
  },
  {
    label: 'Zusätzliche Hinweise',
    value: input.instructions.trim() || 'keine'
  }
];

export const buildRoomInsertPrompt = (input: CreateGenerationInput) => {
  const presetEffects = getRoomInsertPresetEffects(input);
  const protectionRules = getRoomInsertProtectionRules(input);

  return [
    'Du setzt ein Möbelbild plausibel in ein Raumfoto für eine Kundenpräsentation ein.',
    'Die Position befindet sich in der markierten Zielregion.',
    ...protectionRules
      .map((rule) => rule.appliedFragment)
      .filter((fragment): fragment is string => Boolean(fragment)),
    ...presetEffects.map((effect) => effect.appliedFragment),
    input.placement
      ? `Zielregion: roomImageId=${input.placement.roomImageId}, x=${input.placement.x}, y=${input.placement.y}, width=${input.placement.width}, height=${input.placement.height}.`
      : 'Zielregion fehlt.',
    input.instructions
      ? `Zusätzliche Hinweise: ${input.instructions}.`
      : 'Keine zusätzlichen Hinweise vom Nutzer.',
    `Erzeuge ${input.variantsRequested} plausible Varianten für eine glaubwürdige Raumvorschau.`
  ].join('\n');
};
