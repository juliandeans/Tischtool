import type { GenerationPlacement } from '$lib/types/generation';

export class RoomPlacementService {
  normalizePlacement(placement: GenerationPlacement) {
    if (!placement) {
      return null;
    }

    return {
      roomImageId: placement.roomImageId,
      x: Math.round(placement.x),
      y: Math.round(placement.y),
      width: Math.max(0, Math.round(placement.width)),
      height: Math.max(0, Math.round(placement.height))
    };
  }

  validatePlacement(placement: GenerationPlacement) {
    if (!placement) {
      return {
        valid: false,
        message: 'Placement is required for room_insert mode.'
      };
    }

    const hasValidSize = placement.width > 0 && placement.height > 0;

    return {
      valid: hasValidSize,
      message: hasValidSize ? null : 'Placement width and height must be greater than zero.'
    };
  }
}

export const roomPlacementService = new RoomPlacementService();
