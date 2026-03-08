import type { CreateGenerationInput } from '$lib/types/generation';

export const buildEnvironmentEditPrompt = (input: CreateGenerationInput) => {
  return [
    'Mode: environment_edit.',
    `Style preset: ${input.stylePreset}.`,
    `Light preset: ${input.lightPreset}.`,
    `Instructions: ${input.instructions || 'none'}.`,
    `Preserve object: ${input.preserveObject ? 'yes' : 'no'}.`,
    `Preserve perspective: ${input.preservePerspective ? 'yes' : 'no'}.`
  ].join(' ');
};
