import type { PageServerLoad } from './$types';

import { costService } from '$lib/server/services/CostService';
import { projectService } from '$lib/server/services/ProjectService';

export const load: PageServerLoad = async ({ url }) => {
  const selectedProjectId = url.searchParams.get('projectId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const [summary, projects] = await Promise.all([
    costService.getSummary(),
    projectService.listProjects()
  ]);
  const validProjectId =
    selectedProjectId && projects.some((project) => project.id === selectedProjectId)
      ? selectedProjectId
      : '';
  const logs = await costService.getLogs({
    projectId: validProjectId || null,
    startDate,
    endDate
  });

  return {
    summary,
    logs,
    filters: {
      projectId: validProjectId,
      startDate: startDate ?? '',
      endDate: endDate ?? ''
    },
    projects: projects.map((project) => ({
      value: project.id,
      label: project.name
    }))
  };
};
