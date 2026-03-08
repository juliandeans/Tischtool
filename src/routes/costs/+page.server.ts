import type { PageServerLoad } from './$types';

import { costService } from '$lib/server/services/CostService';

export const load: PageServerLoad = async () => {
  const [summary, logs] = await Promise.all([costService.getSummary(), costService.getLogs()]);

  return {
    summary,
    logs
  };
};
