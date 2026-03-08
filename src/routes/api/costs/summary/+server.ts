import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetCostsSummaryResponse } from '$lib/types/api';
import { costService } from '$lib/server/services/CostService';

export const GET: RequestHandler = async () => {
  const body: GetCostsSummaryResponse = await costService.getSummary();

  return json(body);
};
