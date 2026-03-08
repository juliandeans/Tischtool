import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { imageService } from '$lib/server/services/ImageService';
import { projectService } from '$lib/server/services/ProjectService';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const [project, images] = await Promise.all([
      projectService.getProject(params.id),
      imageService.listLibraryImages(params.id)
    ]);

    return {
      id: params.id,
      project,
      images
    };
  } catch {
    throw error(404, 'Projekt nicht gefunden.');
  }
};
