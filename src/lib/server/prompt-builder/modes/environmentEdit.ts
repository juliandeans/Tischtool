import type { CreateGenerationInput } from '$lib/types/generation';

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

export const buildEnvironmentEditPrompt = (input: CreateGenerationInput) => {
  const styleFragment =
    STYLE_PRESET_FRAGMENTS[input.stylePreset] || STYLE_PRESET_FRAGMENTS.original;
  const lightFragment =
    LIGHT_PRESET_FRAGMENTS[input.lightPreset] || LIGHT_PRESET_FRAGMENTS.original;

  return [
    'Du bearbeitest ein Möbel-Visualisierungsbild für eine Kundenpräsentation.',
    'Das Hauptobjekt muss in Perspektive, Kamerawinkel, Maßstab, Proportionen und Konstruktion erhalten bleiben.',
    'Verändere primär die Umgebung.',
    'Füge keine zusätzlichen Möbel hinzu.',
    input.preserveObject
      ? 'Erhalte das Möbelobjekt in Form, Konstruktion und Materialanmutung.'
      : 'Das Möbelobjekt darf behutsam angepasst werden.',
    input.preservePerspective
      ? 'Erhalte Perspektive, Kamerawinkel und Bildausschnitt möglichst genau.'
      : 'Perspektive und Bildausschnitt dürfen vorsichtig angepasst werden.',
    styleFragment,
    lightFragment,
    input.instructions
      ? `Zusätzliche Hinweise: ${input.instructions}.`
      : 'Keine zusätzlichen Hinweise vom Nutzer.',
    `Erzeuge ${input.variantsRequested} plausible Varianten für eine glaubwürdige Kundenvisualisierung.`
  ].join('\n');
};
