import type { CostLogListItem, CostSummary } from '$lib/types/cost';

export class CostService {
  async getSummary(): Promise<CostSummary> {
    return {
      today: 0,
      month: 0,
      averagePerImage: 0,
      mostExpensiveProject: {
        projectId: null,
        name: null,
        total: 0
      }
    };
  }

  async getLogs(): Promise<CostLogListItem[]> {
    return [
      {
        id: '50000000-0000-0000-0000-000000000001',
        projectId: '10000000-0000-0000-0000-000000000001',
        projectName: 'Esstisch Mueller',
        model: 'imagen',
        totalPrice: 0,
        createdAt: new Date('2026-03-08T12:00:00.000Z').toISOString()
      }
    ];
  }
}

export const costService = new CostService();
