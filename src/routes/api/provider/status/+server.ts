import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetProviderStatusResponse } from '$lib/types/api';
import { providerStatusService } from '$lib/server/services/ProviderStatusService';

export const GET: RequestHandler = async ({ cookies }) => {
  const response: GetProviderStatusResponse = await providerStatusService.getSnapshot(cookies);

  return json(response);
};
