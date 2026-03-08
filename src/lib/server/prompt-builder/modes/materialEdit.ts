import type { CreateGenerationInput } from '$lib/types/generation';

const MATERIAL_TARGET_FRAGMENTS: Record<string, string> = {
  'oak-light': 'helle Eiche mit natürlicher, ruhiger Maserung',
  walnut: 'warmes Nussbaumholz mit eleganter Tiefe',
  'ash-natural': 'natürliche Esche mit heller, zurückhaltender Struktur',
  'smoked-oak': 'Räuchereiche mit dunklerem, edlem Charakter',
  'black-stained': 'schwarz gebeiztes Holz mit sichtbarer Holzstruktur'
};

export const buildMaterialEditPrompt = (input: CreateGenerationInput) => {
  const materialFragment =
    (input.targetMaterial && MATERIAL_TARGET_FRAGMENTS[input.targetMaterial]) ||
    MATERIAL_TARGET_FRAGMENTS['oak-light'];

  return [
    'Du bearbeitest ein Möbel-Visualisierungsbild für eine Kundenpräsentation.',
    'Ändere ausschließlich das Material des Möbels.',
    'Behalte Form, Konstruktion, Perspektive, Hintergrund und Licht möglichst unverändert.',
    `Zielmaterial: ${materialFragment}.`,
    input.surfaceDescription
      ? `Oberflächenbeschreibung: ${input.surfaceDescription}.`
      : 'Oberflächenbeschreibung: keine zusätzliche Vorgabe.',
    input.preserveObject
      ? 'Erhalte das Möbelobjekt in Form, Kantenführung und Konstruktion.'
      : 'Das Möbelobjekt darf nur minimal angepasst werden.',
    input.preservePerspective
      ? 'Erhalte Perspektive, Kamerawinkel und Bildausschnitt möglichst genau.'
      : 'Perspektive und Bildausschnitt dürfen nur minimal angepasst werden.',
    input.instructions
      ? `Zusätzliche Hinweise: ${input.instructions}.`
      : 'Keine zusätzlichen Hinweise vom Nutzer.',
    `Erzeuge ${input.variantsRequested} plausible Materialvarianten für eine glaubwürdige Kundenvisualisierung.`
  ].join('\n');
};
