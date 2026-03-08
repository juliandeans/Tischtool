import path from 'node:path';

import { desc, eq } from 'drizzle-orm';
import sharp from 'sharp';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { images, projects } from '$lib/server/db/schema';
import { projectService } from '$lib/server/services/ProjectService';
import { storage } from '$lib/server/storage';
import type {
  ImageDetail,
  ImageSummary,
  LibraryImageListItem,
  UploadImageInput
} from '$lib/types/image';
import { imageTitleFromPath } from '$lib/utils/image';

export class ImageService {
  async listProjectImages(projectId: string) {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const rows = await db
      .select({
        id: images.id,
        projectId: images.projectId,
        parentImageId: images.parentImageId,
        thumbnailPath: images.thumbnailPath
      })
      .from(images)
      .where(eq(images.projectId, projectId))
      .orderBy(desc(images.createdAt));

    return rows;
  }

  async getImage(id: string): Promise<ImageDetail> {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const db = getDb();
    const [image] = await db.select().from(images).where(eq(images.id, id)).limit(1);

    if (!image) {
      throw new Error(`Image ${id} not found.`);
    }

    return {
      id: image.id,
      projectId: image.projectId,
      userId: image.userId,
      parentImageId: image.parentImageId,
      generationId: image.generationId,
      type: image.type as ImageSummary['type'],
      filePath: image.filePath,
      thumbnailPath: image.thumbnailPath,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      placement:
        image.placementX !== null &&
        image.placementY !== null &&
        image.placementWidth !== null &&
        image.placementHeight !== null
          ? {
              x: image.placementX,
              y: image.placementY,
              width: image.placementWidth,
              height: image.placementHeight
            }
          : null,
      promptSnapshot: (image.promptSnapshot as Record<string, unknown> | null) ?? null,
      settingsSnapshot: (image.settingsSnapshot as Record<string, unknown> | null) ?? null,
      createdAt: image.createdAt.toISOString()
    };
  }

  async createUploadedImage(
    input: UploadImageInput
  ): Promise<Pick<ImageSummary, 'id' | 'projectId' | 'type' | 'filePath'>> {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const db = getDb();
    const project = await projectService.getProject(input.projectId);
    const imageId = crypto.randomUUID();
    const target = await storage.prepareUploadTarget(input.projectId, imageId);
    const originalImage = sharp(input.bytes).rotate();
    const metadata = await originalImage.metadata();
    const originalBuffer = await originalImage.png().toBuffer();
    const thumbnailBuffer = await sharp(input.bytes)
      .rotate()
      .resize({
        width: 480,
        height: 480,
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    await storage.writeAsset(target.filePath, originalBuffer);
    await storage.writeAsset(target.thumbnailPath, thumbnailBuffer);

    const settingsSnapshot = {
      originalFileName: path.parse(input.fileName).name,
      uploadedMimeType: input.mimeType
    };

    const [image] = await db
      .insert(images)
      .values({
        id: imageId,
        projectId: input.projectId,
        userId: project.userId,
        type: input.type,
        filePath: target.filePath,
        thumbnailPath: target.thumbnailPath,
        mimeType: 'image/png',
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        settingsSnapshot
      })
      .returning({
        id: images.id,
        projectId: images.projectId,
        type: images.type,
        filePath: images.filePath
      });

    await projectService.setCoverImageIfMissing(input.projectId, image.id);

    return {
      ...image,
      type: image.type as ImageSummary['type']
    };
  }

  async listLibraryImages(projectId?: string | null): Promise<LibraryImageListItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const baseQuery = db
      .select({
        id: images.id,
        projectId: images.projectId,
        projectName: projects.name,
        type: images.type,
        filePath: images.filePath,
        mimeType: images.mimeType,
        width: images.width,
        height: images.height,
        createdAt: images.createdAt,
        settingsSnapshot: images.settingsSnapshot
      })
      .from(images)
      .innerJoin(projects, eq(images.projectId, projects.id));

    const rows = projectId
      ? await baseQuery.where(eq(images.projectId, projectId)).orderBy(desc(images.createdAt))
      : await baseQuery.orderBy(desc(images.createdAt));

    return rows.map((row) => {
      const settings = (row.settingsSnapshot as Record<string, unknown> | null) ?? null;
      const originalFileName =
        typeof settings?.originalFileName === 'string'
          ? settings.originalFileName
          : imageTitleFromPath(row.filePath);

      return {
        id: row.id,
        projectId: row.projectId,
        projectName: row.projectName,
        title: originalFileName,
        type: row.type as ImageSummary['type'],
        createdAt: row.createdAt.toISOString(),
        mimeType: row.mimeType,
        width: row.width,
        height: row.height,
        thumbnailUrl: `/api/images/${row.id}/download?variant=thumbnail`,
        downloadUrl: `/api/images/${row.id}/download?download=1`,
        editUrl: `/editor/${row.id}`
      };
    });
  }

  async getDownloadDescriptor(id: string, variant: 'original' | 'thumbnail' = 'original') {
    const image = await this.getImage(id);
    const selectedPath =
      variant === 'thumbnail' && image.thumbnailPath ? image.thumbnailPath : image.filePath;

    const download = await storage.resolveDownload(selectedPath);
    const title =
      typeof image.settingsSnapshot?.originalFileName === 'string'
        ? image.settingsSnapshot.originalFileName
        : imageTitleFromPath(image.filePath);

    return {
      ...download,
      mimeType: variant === 'thumbnail' ? 'image/png' : image.mimeType,
      fileName: `${title}.png`
    };
  }
}

export const imageService = new ImageService();
