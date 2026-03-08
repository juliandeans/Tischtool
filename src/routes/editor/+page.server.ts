import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { imageService } from '$lib/server/services/ImageService';

export const load: PageServerLoad = async () => {
  const images = await imageService.listLibraryImages();

  if (images[0]) {
    throw redirect(307, images[0].editUrl);
  }

  return {};
};
