import type { CreateGenerationInput, PromptDebugEntry } from '$lib/types/generation';

export const getMaterialModeParameters = (input: CreateGenerationInput): PromptDebugEntry[] => [
  { label: 'Modus', value: 'Stück modellieren' },
  { label: 'Varianten', value: String(input.variantsRequested) },
  { label: 'Raumkontext', value: input.roomPreset ?? 'none' },
  { label: 'Stil', value: input.stylePreset ?? 'original' }
];
