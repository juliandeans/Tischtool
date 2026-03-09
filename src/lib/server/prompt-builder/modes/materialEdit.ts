import type { CreateGenerationInput, MaterialEditSubMode, PromptDebugEntry } from '$lib/types/generation';

const SUB_MODE_LABELS: Record<MaterialEditSubMode, string> = {
  surface: 'Oberfläche',
  form: 'Form',
  style: 'Stil'
};

export const getMaterialModeParameters = (input: CreateGenerationInput): PromptDebugEntry[] => [
  { label: 'Modus', value: 'Stück modellieren' },
  { label: 'Sub-Modus', value: SUB_MODE_LABELS[input.materialEditSubMode ?? 'surface'] },
  { label: 'Varianten', value: String(input.variantsRequested) },
  {
    label: 'Debug',
    value: `material_edit / ${input.materialEditSubMode ?? 'surface'}`
  }
];
