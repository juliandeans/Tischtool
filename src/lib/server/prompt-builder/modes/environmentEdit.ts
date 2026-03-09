import type { CreateGenerationInput, PromptDebugEntry } from '$lib/types/generation';

export const getEnvironmentModeParameters = (input: CreateGenerationInput): PromptDebugEntry[] => [
  { label: 'Modus', value: 'Umgebung' },
  { label: 'Varianten', value: String(input.variantsRequested) },
  { label: 'Raumkontext', value: input.roomPreset ?? 'none' },
  { label: 'Stil', value: input.stylePreset ?? 'original' },
  { label: 'Licht', value: input.lightPreset ?? 'original' }
];
