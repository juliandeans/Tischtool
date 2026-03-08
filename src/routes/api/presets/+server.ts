import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetPresetsResponse } from '$lib/types/api';
import { presetService } from '$lib/server/services/PresetService';

export const GET: RequestHandler = async () => {
  const body: GetPresetsResponse = {
    presets: await presetService.listPresets()
  };

  return json(body);
};
