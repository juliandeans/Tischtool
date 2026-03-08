import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetProjectResponse } from '$lib/types/api';
import { projectService } from '$lib/server/services/ProjectService';

export const GET: RequestHandler = async ({ params }) => {
  const project = await projectService.getProject(params.id);
  const body: GetProjectResponse = { project };

  return json(body);
};
