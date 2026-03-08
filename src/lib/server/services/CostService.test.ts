import { describe, expect, it, vi } from 'vitest';

import { calculateCostSummary } from '$lib/server/services/CostService';

describe('calculateCostSummary', () => {
  it('calculates today, month, average per image and most expensive project', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'));

    const summary = calculateCostSummary({
      logs: [
        { totalPrice: 0.12, createdAt: '2026-03-08T09:00:00.000Z' },
        { totalPrice: 0.08, createdAt: '2026-03-02T10:00:00.000Z' },
        { totalPrice: 0.2, createdAt: '2026-02-27T10:00:00.000Z' }
      ],
      mostExpensiveProjects: [{ projectId: 'p1', name: 'Esstisch Müller', total: 0.4 }],
      totalQuantity: 5
    });

    expect(summary).toEqual({
      today: 0.12,
      month: 0.2,
      averagePerImage: 0.08,
      mostExpensiveProject: {
        projectId: 'p1',
        name: 'Esstisch Müller',
        total: 0.4
      }
    });

    vi.useRealTimers();
  });

  it('avoids division by zero when no logs exist', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'));

    const summary = calculateCostSummary({
      logs: [],
      mostExpensiveProjects: [],
      totalQuantity: 0
    });

    expect(summary.averagePerImage).toBe(0);
    expect(summary.mostExpensiveProject.projectId).toBeNull();

    vi.useRealTimers();
  });
});
