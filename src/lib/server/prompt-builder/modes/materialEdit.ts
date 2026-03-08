import type {
  CreateGenerationInput,
  PromptDebugEntry,
  PromptProtectionRuleDebug,
  ProtectionRuleKey
} from '$lib/types/generation';

const MATERIAL_TARGET_FRAGMENTS: Record<string, string> = {
  'oak-light': 'helle Eiche mit natürlicher, ruhiger Maserung',
  walnut: 'warmes Nussbaumholz mit eleganter Tiefe',
  'ash-natural': 'natürliche Esche mit heller, zurückhaltender Struktur',
  'smoked-oak': 'Räuchereiche mit dunklerem, edlem Charakter',
  'black-stained': 'schwarz gebeiztes Holz mit sichtbarer Holzstruktur'
};

type MaterialRuleDefinition = {
  key: ProtectionRuleKey;
  label: string;
  enabledFragment: string;
  disabledFragment: string | null;
};

const MATERIAL_RULES: MaterialRuleDefinition[] = [
  {
    key: 'preserveForm',
    label: 'Form erhalten',
    enabledFragment: 'Erhalte die Form des Möbels unverändert.',
    disabledFragment: 'Kleine Formanpassungen sind nur im Ausnahmefall erlaubt.'
  },
  {
    key: 'preserveConstruction',
    label: 'Konstruktion erhalten',
    enabledFragment: 'Erhalte Kantenführung, Fugen und Konstruktion des Möbels.',
    disabledFragment: 'Die Konstruktion darf nur minimal angepasst werden.'
  },
  {
    key: 'preservePerspective',
    label: 'Perspektive erhalten',
    enabledFragment: 'Erhalte Perspektive, Kamerawinkel und Bildausschnitt möglichst genau.',
    disabledFragment: 'Perspektive und Bildausschnitt dürfen nur minimal angepasst werden.'
  },
  {
    key: 'preserveBackground',
    label: 'Hintergrund erhalten',
    enabledFragment: 'Behalte Hintergrund und Umgebung möglichst unverändert.',
    disabledFragment: 'Hintergrund und Umgebung dürfen nur leicht neutralisiert werden.'
  },
  {
    key: 'preserveLight',
    label: 'Licht möglichst erhalten',
    enabledFragment: 'Behalte die bestehende Lichtsituation möglichst unverändert.',
    disabledFragment: 'Die Lichtsituation darf nur behutsam angepasst werden.'
  }
];

const getRuleState = (input: CreateGenerationInput, key: ProtectionRuleKey) => {
  if (typeof input.protectionRules?.[key] === 'boolean') {
    return input.protectionRules[key] as boolean;
  }

  if (key === 'preservePerspective') {
    return input.preservePerspective;
  }

  if (key === 'preserveForm' || key === 'preserveConstruction') {
    return input.preserveObject;
  }

  return true;
};

export const getMaterialProtectionRules = (
  input: CreateGenerationInput
): PromptProtectionRuleDebug[] =>
  MATERIAL_RULES.map((rule) => {
    const enabled = getRuleState(input, rule.key);

    return {
      key: rule.key,
      label: rule.label,
      enabled,
      appliedFragment: enabled ? rule.enabledFragment : rule.disabledFragment
    };
  });

export const getMaterialModeParameters = (input: CreateGenerationInput): PromptDebugEntry[] => {
  const materialValue =
    (input.targetMaterial && MATERIAL_TARGET_FRAGMENTS[input.targetMaterial]) ||
    MATERIAL_TARGET_FRAGMENTS['oak-light'];

  return [
    { label: 'Modus', value: 'Material ändern' },
    { label: 'Varianten', value: String(input.variantsRequested) },
    { label: 'Zielmaterial', value: materialValue },
    {
      label: 'Oberfläche',
      value: input.surfaceDescription.trim() || 'keine zusätzliche Vorgabe'
    },
    {
      label: 'Zusätzliche Hinweise',
      value: input.instructions.trim() || 'keine'
    }
  ];
};

export const buildMaterialEditPrompt = (input: CreateGenerationInput) => {
  const materialFragment =
    (input.targetMaterial && MATERIAL_TARGET_FRAGMENTS[input.targetMaterial]) ||
    MATERIAL_TARGET_FRAGMENTS['oak-light'];
  const protectionRules = getMaterialProtectionRules(input);

  return [
    'Du bearbeitest ein Möbel-Visualisierungsbild für eine Kundenpräsentation.',
    'Ändere ausschließlich das Material des Möbels.',
    ...protectionRules
      .map((rule) => rule.appliedFragment)
      .filter((fragment): fragment is string => Boolean(fragment)),
    `Zielmaterial: ${materialFragment}.`,
    input.surfaceDescription
      ? `Oberflächenbeschreibung: ${input.surfaceDescription}.`
      : 'Oberflächenbeschreibung: keine zusätzliche Vorgabe.',
    input.instructions
      ? `Zusätzliche Hinweise: ${input.instructions}.`
      : 'Keine zusätzlichen Hinweise vom Nutzer.',
    `Erzeuge ${input.variantsRequested} plausible Materialvarianten für eine glaubwürdige Kundenvisualisierung.`
  ].join('\n');
};
