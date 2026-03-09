import type { CreateGenerationInput, PromptDebugEntry } from '$lib/types/generation';

export const getRoomPlacementModeParameters = (
  input: CreateGenerationInput
): PromptDebugEntry[] => [
  { label: 'Modus', value: 'Stück platzieren' },
  { label: 'Varianten', value: String(input.variantsRequested) },
  { label: 'Raumkontext', value: input.roomPreset ?? 'none' },
  { label: 'Stil', value: input.stylePreset ?? 'original' },
  { label: 'Licht', value: input.lightPreset ?? 'original' },
  { label: 'Quellbild-ID', value: input.sourceImageId }
];
