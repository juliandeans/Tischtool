import type { PresetSummary } from '$lib/types/preset';

export class PresetService {
  async listPresets(): Promise<PresetSummary[]> {
    const createdAt = new Date('2026-03-08T12:00:00.000Z').toISOString();

    return [
      {
        id: '60000000-0000-0000-0000-000000000001',
        userId: null,
        category: 'style',
        name: 'Original',
        promptFragment: 'Keep the original furniture style.',
        isDefault: true,
        createdAt
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        userId: null,
        category: 'light',
        name: 'Tageslicht',
        promptFragment: 'Use balanced daylight.',
        isDefault: true,
        createdAt
      }
    ];
  }
}

export const presetService = new PresetService();
