import type { GenerationMode } from '$lib/types/generation';

const DEV_UNIT_PRICES: Record<GenerationMode, number> = {
  environment_edit: 0.04,
  material_edit: 0.035,
  room_placement: 0.06
};

export type CostEstimate = {
  estimatedCost: number;
  currency: 'EUR';
  variantsRequested: number;
  unitPrice: number;
  unitType: 'generated_image';
};

export class VertexCostEstimationService {
  estimateVariants(mode: GenerationMode, variantsRequested: number): CostEstimate {
    const safeVariants = Math.max(1, Math.round(variantsRequested));
    const unitPrice = DEV_UNIT_PRICES[mode];

    return {
      estimatedCost: Number((safeVariants * unitPrice).toFixed(4)),
      currency: 'EUR',
      variantsRequested: safeVariants,
      unitPrice,
      unitType: 'generated_image'
    };
  }
}

export const vertexCostEstimationService = new VertexCostEstimationService();
