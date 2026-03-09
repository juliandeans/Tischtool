import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { costLogs, generations, projects } from '$lib/server/db/schema';
import type { CostLogListItem, CostSummary } from '$lib/types/cost';

const toNumber = (value: unknown) => Number(value ?? 0);
const parseDateStart = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateEndExclusive = (value?: string | null) => {
  const date = parseDateStart(value);

  if (!date) {
    return null;
  }

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
};

export const calculateCostSummary = (input: {
  logs: Array<{ totalPrice: number; createdAt: string }>;
  mostExpensiveProjects: Array<{ projectId: string; name: string; total: number }>;
  totalQuantity: number;
}) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const today = input.logs
    .filter((log) => new Date(log.createdAt) >= todayStart)
    .reduce((sum, log) => sum + log.totalPrice, 0);
  const month = input.logs
    .filter((log) => new Date(log.createdAt) >= monthStart)
    .reduce((sum, log) => sum + log.totalPrice, 0);
  const totalCost = input.logs.reduce((sum, log) => sum + log.totalPrice, 0);
  const averagePerImage = input.totalQuantity > 0 ? totalCost / input.totalQuantity : 0;
  const mostExpensiveProject = input.mostExpensiveProjects[0] ?? null;

  return {
    today: Number(today.toFixed(2)),
    month: Number(month.toFixed(2)),
    averagePerImage: Number(averagePerImage.toFixed(2)),
    mostExpensiveProject: {
      projectId: mostExpensiveProject?.projectId ?? null,
      name: mostExpensiveProject?.name ?? null,
      total: Number((mostExpensiveProject?.total ?? 0).toFixed(2))
    }
  } satisfies CostSummary;
};

export class CostService {
  async getSummary(): Promise<CostSummary> {
    if (!isDatabaseConfigured()) {
      return calculateCostSummary({
        logs: [],
        mostExpensiveProjects: [],
        totalQuantity: 0
      });
    }

    const db = getDb();
    const [logs, quantityRows, projectRows] = await Promise.all([
      db
        .select({
          totalPrice: costLogs.totalPrice,
          createdAt: costLogs.createdAt
        })
        .from(costLogs),
      db
        .select({
          quantity: sql<string>`coalesce(sum(${costLogs.quantity}), 0)`
        })
        .from(costLogs),
      db
        .select({
          projectId: projects.id,
          name: projects.name,
          total: sql<string>`coalesce(sum(${costLogs.totalPrice}), 0)`
        })
        .from(costLogs)
        .innerJoin(generations, eq(costLogs.generationId, generations.id))
        .innerJoin(projects, eq(generations.projectId, projects.id))
        .groupBy(projects.id, projects.name)
        .orderBy(sql`coalesce(sum(${costLogs.totalPrice}), 0) desc`)
        .limit(1)
    ]);

    return calculateCostSummary({
      logs: logs.map((log) => ({
        totalPrice: toNumber(log.totalPrice),
        createdAt: log.createdAt.toISOString()
      })),
      mostExpensiveProjects: projectRows.map((row) => ({
        projectId: row.projectId,
        name: row.name,
        total: toNumber(row.total)
      })),
      totalQuantity: toNumber(quantityRows[0]?.quantity)
    });
  }

  async getLogs(filters?: {
    projectId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<CostLogListItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const conditions = [];
    const startDate = parseDateStart(filters?.startDate);
    const endDateExclusive = parseDateEndExclusive(filters?.endDate);

    if (filters?.projectId) {
      conditions.push(eq(projects.id, filters.projectId));
    }

    if (startDate) {
      conditions.push(gte(costLogs.createdAt, startDate));
    }

    if (endDateExclusive) {
      conditions.push(lt(costLogs.createdAt, endDateExclusive));
    }

    const query = db
      .select({
        id: costLogs.id,
        projectId: projects.id,
        projectName: projects.name,
        model: costLogs.model,
        totalPrice: costLogs.totalPrice,
        createdAt: costLogs.createdAt
      })
      .from(costLogs)
      .innerJoin(generations, eq(costLogs.generationId, generations.id))
      .innerJoin(projects, eq(generations.projectId, projects.id))
      .orderBy(desc(costLogs.createdAt));

    const rows = await (conditions.length ? query.where(and(...conditions)) : query);

    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      model: row.model,
      totalPrice: toNumber(row.totalPrice),
      createdAt: row.createdAt.toISOString()
    }));
  }
}

export const costService = new CostService();
