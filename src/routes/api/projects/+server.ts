import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { GetProjectsResponse, PostProjectRequest, PostProjectResponse } from '$lib/types/api';
import { projectService } from '$lib/server/services/ProjectService';

export const GET: RequestHandler = async () => {
  const projects = await projectService.listProjects();
  const body: GetProjectsResponse = { projects };

  return json(body);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as Partial<PostProjectRequest>;

  if (!body.name?.trim()) {
    return json({ error: 'name is required' }, { status: 400 });
  }

  try {
    const project = await projectService.createProject({
      name: body.name,
      description: body.description ?? null
    });

    const response: PostProjectResponse = { project };

    return json(response, { status: 201 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Project creation failed.'
      },
      { status: 500 }
    );
  }
};
