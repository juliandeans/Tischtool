import type { CreateProjectInput, ProjectDetail, ProjectSummary } from '$lib/types/project';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export class ProjectService {
  async listProjects(): Promise<ProjectSummary[]> {
    return [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Esstisch Mueller',
        description: 'Phase-2 Platzhalterprojekt fuer das Backend-Skelett.',
        coverImageId: '30000000-0000-0000-0000-000000000001',
        updatedAt: new Date('2026-03-08T12:00:00.000Z').toISOString()
      }
    ];
  }

  async getProject(id: string): Promise<ProjectDetail> {
    return {
      id,
      userId: DEMO_USER_ID,
      name: 'Esstisch Mueller',
      description: 'Backend-Skelett ohne Persistenz.',
      coverImageId: '30000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-03-08T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-03-08T12:00:00.000Z').toISOString()
    };
  }

  async createProject(input: CreateProjectInput) {
    return {
      id: crypto.randomUUID(),
      name: input.name.trim()
    };
  }
}

export const projectService = new ProjectService();
