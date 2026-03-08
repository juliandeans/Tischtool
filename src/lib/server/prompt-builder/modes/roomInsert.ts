import type { CreateGenerationInput } from '$lib/types/generation';

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

export const buildRoomInsertPrompt = (input: CreateGenerationInput) => {
  const styleFragment =
    STYLE_PRESET_FRAGMENTS[input.stylePreset] || STYLE_PRESET_FRAGMENTS.original;
  const lightFragment =
    LIGHT_PRESET_FRAGMENTS[input.lightPreset] || LIGHT_PRESET_FRAGMENTS.original;

  return [
    'Du setzt ein Möbelbild plausibel in ein Raumfoto für eine Kundenpräsentation ein.',
    'Die Position befindet sich in der markierten Zielregion.',
    'Das Möbel soll Form, Proportion und Konstruktion behalten.',
    'Passe Licht und Schatten so an, dass das Ergebnis wie eine glaubwürdige Kundenvisualisierung wirkt.',
    'Füge keine weiteren Möbel hinzu.',
    styleFragment,
    lightFragment,
    input.placement
      ? `Zielregion: roomImageId=${input.placement.roomImageId}, x=${input.placement.x}, y=${input.placement.y}, width=${input.placement.width}, height=${input.placement.height}.`
      : 'Zielregion fehlt.',
    input.instructions
      ? `Zusätzliche Hinweise: ${input.instructions}.`
      : 'Keine zusätzlichen Hinweise vom Nutzer.',
    input.preserveObject
      ? 'Erhalte das Möbelobjekt in Form und Konstruktion.'
      : 'Das Möbelobjekt darf nur minimal angepasst werden.',
    input.preservePerspective
      ? 'Erhalte die Perspektive des Möbels und passe es plausibel an die Raumansicht an.'
      : 'Perspektivische Anpassungen sind nur minimal erlaubt.',
    `Erzeuge ${input.variantsRequested} plausible Varianten für eine glaubwürdige Raumvorschau.`
  ].join('\n');
};
