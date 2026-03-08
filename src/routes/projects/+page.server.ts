import type { PageServerLoad } from './$types';

import { projectService } from '$lib/server/services/ProjectService';

export const load: PageServerLoad = async () => {
  const projects = await projectService.listProjectCards();

  return {
    projects
  };
};
