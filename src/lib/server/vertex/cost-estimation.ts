export class VertexCostEstimationService {
  estimateVariants(variantsRequested: number) {
    return {
      estimatedCost: 0,
      currency: 'EUR',
      variantsRequested
    };
  }
}

export const vertexCostEstimationService = new VertexCostEstimationService();
