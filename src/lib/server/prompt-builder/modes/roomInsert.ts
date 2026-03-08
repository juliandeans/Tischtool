import type { CreateGenerationInput } from '$lib/types/generation';

export const buildRoomInsertPrompt = (input: CreateGenerationInput) => {
  return [
    'Mode: room_insert.',
    `Style preset: ${input.stylePreset}.`,
    `Light preset: ${input.lightPreset}.`,
    `Instructions: ${input.instructions || 'none'}.`,
    input.placement
      ? `Placement target: roomImageId=${input.placement.roomImageId}, x=${input.placement.x}, y=${input.placement.y}, width=${input.placement.width}, height=${input.placement.height}.`
      : 'Placement target: missing.',
    `Preserve object: ${input.preserveObject ? 'yes' : 'no'}.`,
    `Preserve perspective: ${input.preservePerspective ? 'yes' : 'no'}.`
  ].join(' ');
};
