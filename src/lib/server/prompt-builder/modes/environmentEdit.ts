import type {
  CreateGenerationInput,
  PromptDebugEntry,
  PromptInstructionDebug,
  PromptPresetEffect,
  PromptProtectionRuleDebug,
  ProtectionRuleKey,
} from "$lib/types/generation";

const STYLE_PRESET_FRAGMENTS: Record<string, string> = {
  original: "Behalte die bisherige Stilwirkung weitgehend bei.",
  editorial: "Gestalte die Umgebung reduziert, klar und editorial.",
  wohnlich: "Gestalte die Umgebung warm, wohnlich und einladend.",
};

const LIGHT_PRESET_FRAGMENTS: Record<string, string> = {
  original: "Behalte die bisherige Lichtsituation weitgehend bei.",
  tageslicht: "Nutze klares, freundliches Tageslicht.",
  abendlicht: "Nutze warmes, weiches Abendlicht.",
};

type EnvironmentRuleDefinition = {
  key: ProtectionRuleKey;
  label: string;
  enabledFragment: string;
  disabledFragment: string | null;
};

const ENVIRONMENT_RULES: EnvironmentRuleDefinition[] = [
  {
    key: "preserveObject",
    label: "Objekt erhalten",
    enabledFragment:
      "Erhalte das Möbelobjekt in Form, Konstruktion und Materialanmutung.",
    disabledFragment: "Das Möbelobjekt darf behutsam angepasst werden.",
  },
  {
    key: "preservePerspective",
    label: "Perspektive erhalten",
    enabledFragment:
      "Erhalte Perspektive, Kamerawinkel und Bildausschnitt möglichst genau.",
    disabledFragment:
      "Perspektive und Bildausschnitt dürfen vorsichtig angepasst werden.",
  },
  {
    key: "preserveFrame",
    label: "Bildausschnitt möglichst erhalten",
    enabledFragment:
      "Erhalte den vorhandenen Bildausschnitt möglichst vollständig.",
    disabledFragment:
      "Der Bildausschnitt darf bei Bedarf leicht neu gewichtet werden.",
  },
  {
    key: "noExtraFurniture",
    label: "Keine zusätzlichen Möbel",
    enabledFragment: "Füge keine zusätzlichen Möbel hinzu.",
    disabledFragment:
      "Weitere Möbel sind nur erlaubt, wenn sie in den visuellen Anforderungen ausdrücklich verlangt werden.",
  },
  {
    key: "changeEnvironmentFirst",
    label: "Änderungen primär an der Umgebung",
    enabledFragment:
      "Ändere primär Wand, Hintergrund, Licht und Atmosphäre der Umgebung.",
    disabledFragment:
      "Neben der Umgebung dürfen auch kleine Objektanpassungen vorkommen.",
  },
];

const buildSection = (title: string, lines: string[]) =>
  [title, ...lines.map((line) => `- ${line}`)].join("\n");

const uniqueLines = (lines: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      lines
        .map((line) => line?.trim())
        .filter((line): line is string => Boolean(line))
    )
  );

const getRuleState = (input: CreateGenerationInput, key: ProtectionRuleKey) => {
  if (typeof input.protectionRules?.[key] === "boolean") {
    return input.protectionRules[key] as boolean;
  }

  if (key === "preserveObject") {
    return input.preserveObject;
  }

  if (key === "preservePerspective") {
    return input.preservePerspective;
  }

  return true;
};

export const getEnvironmentPresetEffects = (
  input: CreateGenerationInput
): PromptPresetEffect[] => {
  const styleValue = STYLE_PRESET_FRAGMENTS[input.stylePreset]
    ? input.stylePreset
    : "original";
  const lightValue = LIGHT_PRESET_FRAGMENTS[input.lightPreset]
    ? input.lightPreset
    : "original";

  return [
    {
      label: "Stil-Preset",
      value: styleValue,
      appliedFragment: STYLE_PRESET_FRAGMENTS[styleValue],
    },
    {
      label: "Licht-Preset",
      value: lightValue,
      appliedFragment: LIGHT_PRESET_FRAGMENTS[lightValue],
    },
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
      appliedFragment: enabled ? rule.enabledFragment : rule.disabledFragment,
    };
  });

export const getEnvironmentModeParameters = (
  input: CreateGenerationInput
): PromptDebugEntry[] => [
  { label: "Modus", value: "Umgebung ändern" },
  { label: "Varianten", value: String(input.variantsRequested) },
  { label: "Stil", value: input.stylePreset },
  { label: "Licht", value: input.lightPreset },
];

export const buildEnvironmentEditPrompt = (
  input: CreateGenerationInput,
  instructionDebug: PromptInstructionDebug
) => {
  const presetEffects = getEnvironmentPresetEffects(input);
  const protectionRules = getEnvironmentProtectionRules(input);
  const preservationRules = uniqueLines(
    protectionRules
      .filter((rule) =>
        [
          "preserveObject",
          "preservePerspective",
          "preserveFrame",
          "noExtraFurniture",
        ].includes(rule.key)
      )
      .map((rule) => rule.appliedFragment)
  );
  const changeAreaRules = uniqueLines([
    protectionRules.find((rule) => rule.key === "changeEnvironmentFirst")
      ?.appliedFragment,
    "Verändere primär die Umgebung und nicht das Möbel als neues Objekt.",
  ]);
  const styleLines = uniqueLines(
    presetEffects
      .filter((effect) => effect.label === "Stil-Preset")
      .map((effect) => effect.appliedFragment)
  );
  const lightLines = uniqueLines(
    presetEffects
      .filter((effect) => effect.label === "Licht-Preset")
      .map((effect) => effect.appliedFragment)
  );

  return [
    buildSection("Kontext:", [
      "Du bearbeitest ein Möbel-Visualisierungsbild für eine Kundenpräsentation.",
      "Der Fokus liegt auf einer plausiblen, kontrollierten Umfeldanpassung.",
    ]),
    buildSection("Erhaltungsregeln:", preservationRules),
    buildSection("Änderungsbereich:", changeAreaRules),
    buildSection("Stil:", styleLines),
    buildSection("Licht:", lightLines),
    ...(instructionDebug.normalizedLines.length
      ? [
          buildSection(
            "Entscheidende zusätzliche Hinweise:",
            instructionDebug.normalizedLines
          ),
        ]
      : []),
    buildSection("Ausgabeziel:", [
      `Erzeuge ${input.variantsRequested} plausible Varianten für eine glaubwürdige Kundenvisualisierung.`,
    ]),
  ].join("\n\n");
};
