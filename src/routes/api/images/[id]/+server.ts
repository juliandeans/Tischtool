import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetImageResponse } from '$lib/types/api';
import { imageService } from '$lib/server/services/ImageService';

export const GET: RequestHandler = async ({ params }) => {
  const image = await imageService.getImage(params.id);
  const body: GetImageResponse = { image };

  return json(body);
};
