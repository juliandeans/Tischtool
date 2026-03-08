import { count, desc, eq } from 'drizzle-orm';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { images, projects, users } from '$lib/server/db/schema';
import { DEV_USER } from '$lib/server/services/dev-user';
import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectListItem,
  ProjectSummary
} from '$lib/types/project';

export class ProjectService {
  async listProjects(): Promise<ProjectSummary[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        coverImageId: projects.coverImageId,
        updatedAt: projects.updatedAt
      })
      .from(projects)
      .orderBy(desc(projects.updatedAt));

    return rows.map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString()
    }));
  }

  async getProject(id: string): Promise<ProjectDetail> {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project) {
      throw new Error(`Project ${id} not found.`);
    }

    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      coverImageId: project.coverImageId,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  async createProject(input: CreateProjectInput) {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const db = getDb();
    await this.ensureDefaultUser();

    const [project] = await db
      .insert(projects)
      .values({
        userId: DEV_USER.id,
        name: input.name.trim(),
        description: input.description
      })
      .returning({
        id: projects.id,
        name: projects.name
      });

    return project;
  }

  async listProjectCards(): Promise<ProjectListItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const [projectRows, countRows] = await Promise.all([
      db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          coverImageId: projects.coverImageId,
          updatedAt: projects.updatedAt
        })
        .from(projects)
        .orderBy(desc(projects.updatedAt)),
      db
        .select({
          projectId: images.projectId,
          imageCount: count(images.id)
        })
        .from(images)
        .groupBy(images.projectId)
    ]);

    const countMap = new Map(countRows.map((row) => [row.projectId, row.imageCount]));

    return projectRows.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      coverImageId: project.coverImageId,
      updatedAt: project.updatedAt.toISOString(),
      imageCount: Number(countMap.get(project.id) ?? 0),
      coverThumbnailUrl: project.coverImageId
        ? `/api/images/${project.coverImageId}/download?variant=thumbnail`
        : null
    }));
  }

  async ensureDefaultUser() {
    if (!isDatabaseConfigured()) {
      return;
    }

    const db = getDb();

    await db
      .insert(users)
      .values({
        id: DEV_USER.id,
        email: DEV_USER.email,
        name: DEV_USER.name
      })
      .onConflictDoNothing();
  }

  async setCoverImageIfMissing(projectId: string, imageId: string) {
    if (!isDatabaseConfigured()) {
      return;
    }

    const db = getDb();
    const [project] = await db
      .select({
        coverImageId: projects.coverImageId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project || project.coverImageId) {
      return;
    }

    await db
      .update(projects)
      .set({
        coverImageId: imageId,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId));
  }

  async touchProject(projectId: string) {
    if (!isDatabaseConfigured()) {
      return;
    }

    const db = getDb();

    await db
      .update(projects)
      .set({
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId));
  }

  async syncCoverImage(projectId: string) {
    if (!isDatabaseConfigured()) {
      return;
    }

    const db = getDb();
    const [latestImage] = await db
      .select({
        id: images.id
      })
      .from(images)
      .where(eq(images.projectId, projectId))
      .orderBy(desc(images.createdAt))
      .limit(1);

    await db
      .update(projects)
      .set({
        coverImageId: latestImage?.id ?? null,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId));
  }
}

export const projectService = new ProjectService();
