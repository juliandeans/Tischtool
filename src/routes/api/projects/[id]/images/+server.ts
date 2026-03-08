import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetProjectImagesResponse } from '$lib/types/api';
import { imageService } from '$lib/server/services/ImageService';

export const GET: RequestHandler = async ({ params }) => {
  const images = await imageService.listProjectImages(params.id);
  const body: GetProjectImagesResponse = { images };

  return json(body);
};
