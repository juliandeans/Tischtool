import type {
  CreateGenerationInput,
  PromptDebugEntry,
  PromptInstructionDebug,
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

const buildSection = (title: string, lines: string[]) =>
  [title, ...lines.map((line) => `- ${line}`)].join('\n');

const uniqueLines = (lines: Array<string | null | undefined>) =>
  Array.from(
    new Set(lines.map((line) => line?.trim()).filter((line): line is string => Boolean(line)))
  );

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
  }
];

export const buildRoomInsertPrompt = (
  input: CreateGenerationInput,
  instructionDebug: PromptInstructionDebug
) => {
  const presetEffects = getRoomInsertPresetEffects(input);
  const protectionRules = getRoomInsertProtectionRules(input);
  const preservationRules = uniqueLines(
    protectionRules
      .filter((rule) => ['preserveObject', 'preservePerspective'].includes(rule.key))
      .map((rule) => rule.appliedFragment)
  );
  const changeAreaRules = uniqueLines([
    protectionRules.find((rule) => rule.key === 'noExtraFurniture')?.appliedFragment,
    protectionRules.find((rule) => rule.key === 'adaptLighting')?.appliedFragment,
    'Setze das Möbel plausibel in die markierte Zielregion ein.'
  ]);
  const placementLines = input.placement
    ? [
        `Raumfoto-ID: ${input.placement.roomImageId}.`,
        `Zielregion: x=${input.placement.x}, y=${input.placement.y}, width=${input.placement.width}, height=${input.placement.height}.`
      ]
    : [
        'Setze das Möbel plausibel in das Raumfoto ein.',
        'Die Zielregion ist aktuell noch nicht gesetzt.'
      ];
  const styleLines = uniqueLines(
    presetEffects
      .filter((effect) => effect.label === 'Stil-Preset')
      .map((effect) => effect.appliedFragment)
  );
  const lightLines = uniqueLines(
    presetEffects
      .filter((effect) => effect.label === 'Licht-Preset')
      .map((effect) => effect.appliedFragment)
  );

  return [
    buildSection('Kontext:', [
      'Du setzt ein Möbelbild plausibel in ein Raumfoto für eine Kundenpräsentation ein.',
      ...placementLines
    ]),
    buildSection('Erhaltungsregeln:', preservationRules),
    buildSection('Änderungsbereich:', changeAreaRules),
    buildSection('Stil:', styleLines),
    buildSection('Licht:', lightLines),
    ...(instructionDebug.normalizedLines.length
      ? [buildSection('Entscheidende zusätzliche Hinweise:', instructionDebug.normalizedLines)]
      : []),
    buildSection('Ausgabeziel:', [
      `Erzeuge ${input.variantsRequested} plausible Varianten für eine glaubwürdige Raumvorschau.`
    ])
  ].join('\n\n');
};
