import type { PageServerLoad } from './$types';

import { imageService } from '$lib/server/services/ImageService';
import { projectService } from '$lib/server/services/ProjectService';

export const load: PageServerLoad = async ({ url }) => {
  const projectId = url.searchParams.get('projectId');

  const [projects, images] = await Promise.all([
    projectService.listProjects(),
    imageService.listLibraryImages(projectId)
  ]);

  return {
    images,
    projects,
    selectedProjectId: projectId
  };
};
