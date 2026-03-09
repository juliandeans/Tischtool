import type {
  CreateGenerationInput,
  PromptDebugEntry,
  PromptInstructionDebug,
  PromptPresetEffect,
  PromptProtectionRuleDebug,
  ProtectionRuleKey
} from '$lib/types/generation';

const STYLE_PRESET_FRAGMENTS: Record<string, string> = {
  original: 'Behalte die bisherige Stilwirkung weitgehend bei.',
  editorial: 'Gestalte die Umgebung reduziert, klar und editorial.',
  wohnlich: 'Gestalte die Umgebung warm, wohnlich und einladend.'
};

const LIGHT_PRESET_FRAGMENTS: Record<string, string> = {
  original: 'Behalte die bisherige Lichtsituation weitgehend bei.',
  tageslicht: 'Nutze klares, freundliches Tageslicht.',
  abendlicht: 'Nutze warmes, weiches Abendlicht.'
};

type EnvironmentRuleDefinition = {
  key: ProtectionRuleKey;
  label: string;
  enabledFragment: string;
  disabledFragment: string | null;
};

const ENVIRONMENT_RULES: EnvironmentRuleDefinition[] = [
  {
    key: 'preserveObject',
    label: 'Objekt erhalten',
    enabledFragment: 'Erhalte das Möbelobjekt in Form, Konstruktion und Materialanmutung.',
    disabledFragment: 'Das Möbelobjekt darf behutsam angepasst werden.'
  },
  {
    key: 'preservePerspective',
    label: 'Perspektive erhalten',
    enabledFragment: 'Erhalte Perspektive, Kamerawinkel und Bildausschnitt möglichst genau.',
    disabledFragment: 'Perspektive und Bildausschnitt dürfen vorsichtig angepasst werden.'
  },
  {
    key: 'preserveFrame',
    label: 'Bildausschnitt möglichst erhalten',
    enabledFragment: 'Erhalte den vorhandenen Bildausschnitt möglichst vollständig.',
    disabledFragment: 'Der Bildausschnitt darf bei Bedarf leicht neu gewichtet werden.'
  },
  {
    key: 'noExtraFurniture',
    label: 'Keine zusätzlichen Möbel',
    enabledFragment: 'Füge keine zusätzlichen Möbel hinzu.',
    disabledFragment:
      'Weitere Möbel sind nur erlaubt, wenn sie in den visuellen Anforderungen ausdrücklich verlangt werden.'
  },
  {
    key: 'changeEnvironmentFirst',
    label: 'Änderungen primär an der Umgebung',
    enabledFragment: 'Ändere primär Wand, Hintergrund, Licht und Atmosphäre der Umgebung.',
    disabledFragment: 'Neben der Umgebung dürfen auch kleine Objektanpassungen vorkommen.'
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

export const getEnvironmentPresetEffects = (input: CreateGenerationInput): PromptPresetEffect[] => {
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

export const getEnvironmentProtectionRules = (
  input: CreateGenerationInput
): PromptProtectionRuleDebug[] =>
  ENVIRONMENT_RULES.map((rule) => {
    const enabled = getRuleState(input, rule.key);

    return {
      key: rule.key,
      label: rule.label,
      enabled,
      appliedFragment: enabled ? rule.enabledFragment : rule.disabledFragment
    };
  });

export const getEnvironmentModeParameters = (input: CreateGenerationInput): PromptDebugEntry[] => [
  { label: 'Modus', value: 'Umgebung ändern' },
  { label: 'Varianten', value: String(input.variantsRequested) },
  { label: 'Stil', value: input.stylePreset },
  { label: 'Licht', value: input.lightPreset }
];

export const buildEnvironmentEditPrompt = (
  input: CreateGenerationInput,
  instructionDebug: PromptInstructionDebug
) => {
  return 'Edit the provided image [1].\n\nKeep the wooden shelf EXACTLY unchanged:\nsame structure, same geometry, same number of compartments, same dimensions, same wood grain, same wood color, and same positions of all boards.\nDo not rebuild, simplify, move, remove, resize, or redesign the shelf in any way.\n\nOnly modify the environment around the shelf.\n\nApply these changes:\n- Paint the wall behind the shelf a soft sage green color.\n- Add a few books neatly inside some of the shelf compartments.\n- Place two small potted plants on top of the shelf.\n\nEverything else must remain identical to the original image:\nsame camera angle, same perspective, same lighting, same parquet floor, same Persian rug, same room layout.\n\nPhotorealistic interior photo edit.';
};

export const buildEnvironmentEditPromptGemini = (
  input: CreateGenerationInput,
  instructionDebug: PromptInstructionDebug
) => {
  return 'Du bearbeitest ein Innenraum-Foto mit einem Holzregal.\n\nBehalte unverändert:\nDas Holzregal exakt wie abgebildet – Struktur, Fächer, Maße, Holzfarbe und alle vorhandenen Objekte darin.\nPerspektive, Kamerawinkel und Bildausschnitt.\nParkett, Teppich und restliche Raumgeometrie.\n\nÄndere folgende Aspekte:\nSalbeifarbene Wand.\nRegal voller Bücher.\nViele Pflanzen auf dem Regal.\n\nPhotorealistisches Interieur-Foto.';
};
