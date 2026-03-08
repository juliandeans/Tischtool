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
        promptFragment: 'Behalte die bisherige Stilwirkung weitgehend bei.',
        isDefault: true,
        createdAt
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        userId: null,
        category: 'style',
        name: 'Editorial',
        promptFragment: 'Gestalte die Umgebung reduziert, klar und editorial.',
        isDefault: true,
        createdAt
      },
      {
        id: '60000000-0000-0000-0000-000000000003',
        userId: null,
        category: 'style',
        name: 'Wohnlich',
        promptFragment: 'Gestalte die Umgebung warm, wohnlich und einladend.',
        isDefault: true,
        createdAt
      },
      {
        id: '60000000-0000-0000-0000-000000000004',
        userId: null,
        category: 'light',
        name: 'Original',
        promptFragment: 'Behalte die bisherige Lichtsituation weitgehend bei.',
        isDefault: true,
        createdAt
      },
      {
        id: '60000000-0000-0000-0000-000000000005',
        userId: null,
        category: 'light',
        name: 'Tageslicht',
        promptFragment: 'Nutze klares, freundliches Tageslicht.',
        isDefault: true,
        createdAt
      },
      {
        id: '60000000-0000-0000-0000-000000000006',
        userId: null,
        category: 'light',
        name: 'Abendlicht',
        promptFragment: 'Nutze warmes, weiches Abendlicht.',
        isDefault: true,
        createdAt
      }
    ];
  }
}

export const presetService = new PresetService();
