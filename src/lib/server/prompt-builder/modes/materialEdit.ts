import type {
  CreateGenerationInput,
  PromptDebugEntry,
  PromptInstructionDebug,
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
    }
  ];
};

export const buildMaterialEditPrompt = (
  input: CreateGenerationInput,
  instructionDebug: PromptInstructionDebug
) => {
  const materialFragment =
    (input.targetMaterial && MATERIAL_TARGET_FRAGMENTS[input.targetMaterial]) ||
    MATERIAL_TARGET_FRAGMENTS['oak-light'];
  const protectionRules = getMaterialProtectionRules(input);
  const preservationRules = uniqueLines(protectionRules.map((rule) => rule.appliedFragment));
  const changeAreaRules = uniqueLines([
    'Ändere ausschließlich Material und Oberflächenwirkung des Möbels.',
    `Zielmaterial: ${materialFragment}.`,
    input.surfaceDescription
      ? `Oberflächenbeschreibung: ${input.surfaceDescription}.`
      : 'Oberflächenbeschreibung: keine zusätzliche Vorgabe.'
  ]);
  const styleLines = ['Kein separates Stil-Preset: Behalte die vorhandene Stilwirkung bei.'];
  const lightLines = ['Kein separates Licht-Preset: Behalte die vorhandene Lichtsituation bei.'];

  return [
    buildSection('Kontext:', [
      'Du bearbeitest ein Möbel-Visualisierungsbild für eine Kundenpräsentation.',
      'Der Fokus liegt ausschließlich auf Material und Oberflächenwirkung des Möbels.'
    ]),
    buildSection('Erhaltungsregeln:', preservationRules),
    ...(instructionDebug.normalizedLines.length
      ? [buildSection('Entscheidende zusätzliche Hinweise:', instructionDebug.normalizedLines)]
      : []),
    buildSection('Änderungsbereich:', changeAreaRules),
    buildSection('Stil:', styleLines),
    buildSection('Licht:', lightLines),
    buildSection('Ausgabeziel:', [
      `Erzeuge ${input.variantsRequested} plausible Materialvarianten für eine glaubwürdige Kundenvisualisierung.`
    ])
  ].join('\n\n');
};
