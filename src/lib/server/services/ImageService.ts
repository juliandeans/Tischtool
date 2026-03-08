import path from 'node:path';

import { desc, eq } from 'drizzle-orm';
import sharp from 'sharp';

import { getDb, isDatabaseConfigured } from '$lib/server/db';
import { images, projects } from '$lib/server/db/schema';
import { projectService } from '$lib/server/services/ProjectService';
import { storage } from '$lib/server/storage';
import type { GenerationMode, GenerationPlacement } from '$lib/types/generation';
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

  async listChildVariants(parentImageId: string): Promise<LibraryImageListItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const rows = await db
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
      .innerJoin(projects, eq(images.projectId, projects.id))
      .where(eq(images.parentImageId, parentImageId))
      .orderBy(desc(images.createdAt));

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

  async listGeneratedImagesByMode(
    projectId: string,
    mode: Extract<GenerationMode, 'environment_edit' | 'material_edit' | 'room_insert'>
  ): Promise<LibraryImageListItem[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }

    const db = getDb();
    const rows = await db
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
        settingsSnapshot: images.settingsSnapshot,
        promptSnapshot: images.promptSnapshot
      })
      .from(images)
      .innerJoin(projects, eq(images.projectId, projects.id))
      .where(eq(images.projectId, projectId))
      .orderBy(desc(images.createdAt));

    return rows
      .filter((row) => {
        const promptSnapshot = (row.promptSnapshot as Record<string, unknown> | null) ?? null;
        return row.type === 'generated' && promptSnapshot?.mode === mode;
      })
      .map((row) => {
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

  async getEditorImage(id: string) {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const db = getDb();
    const [row] = await db
      .select({
        id: images.id,
        projectId: images.projectId,
        projectName: projects.name,
        userId: images.userId,
        parentImageId: images.parentImageId,
        generationId: images.generationId,
        type: images.type,
        filePath: images.filePath,
        thumbnailPath: images.thumbnailPath,
        mimeType: images.mimeType,
        width: images.width,
        height: images.height,
        placementX: images.placementX,
        placementY: images.placementY,
        placementWidth: images.placementWidth,
        placementHeight: images.placementHeight,
        promptSnapshot: images.promptSnapshot,
        settingsSnapshot: images.settingsSnapshot,
        createdAt: images.createdAt
      })
      .from(images)
      .innerJoin(projects, eq(images.projectId, projects.id))
      .where(eq(images.id, id))
      .limit(1);

    if (!row) {
      throw new Error(`Image ${id} not found.`);
    }

    const settings = (row.settingsSnapshot as Record<string, unknown> | null) ?? null;
    const title =
      typeof settings?.originalFileName === 'string'
        ? settings.originalFileName
        : imageTitleFromPath(row.filePath);

    return {
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      userId: row.userId,
      parentImageId: row.parentImageId,
      generationId: row.generationId,
      type: row.type as ImageSummary['type'],
      title,
      filePath: row.filePath,
      thumbnailPath: row.thumbnailPath,
      mimeType: row.mimeType,
      width: row.width,
      height: row.height,
      placement:
        row.placementX !== null &&
        row.placementY !== null &&
        row.placementWidth !== null &&
        row.placementHeight !== null
          ? {
              x: row.placementX,
              y: row.placementY,
              width: row.placementWidth,
              height: row.placementHeight
            }
          : null,
      promptSnapshot: (row.promptSnapshot as Record<string, unknown> | null) ?? null,
      settingsSnapshot: settings,
      createdAt: row.createdAt.toISOString(),
      imageUrl: `/api/images/${row.id}/download`,
      thumbnailUrl: `/api/images/${row.id}/download?variant=thumbnail`,
      downloadUrl: `/api/images/${row.id}/download?download=1`,
      editUrl: `/editor/${row.id}`
    };
  }

  async createGeneratedVariant(input: {
    sourceImageId: string;
    generationId: string;
    mode: GenerationMode;
    variantIndex: number;
    placement: GenerationPlacement;
    promptSnapshot: Record<string, unknown>;
    settingsSnapshot: Record<string, unknown>;
    generatedAsset?: {
      bytes: Uint8Array;
      mimeType: string;
      provider: 'vertex' | 'dev-fake';
    };
  }) {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const db = getDb();
    const sourceImage = await this.getImage(input.sourceImageId);
    const imageId = crypto.randomUUID();
    const sourceBytes = await storage.readAsset(sourceImage.filePath);
    const target = await storage.prepareUploadTarget(sourceImage.projectId, imageId);
    const badgeHue = ['#0057B8', '#F2C500', '#E33A2C'][input.variantIndex % 3];
    const modeConfig =
      input.mode === 'material_edit'
        ? { label: 'MAT', suffix: 'mat', subtitle: 'Material Fake Flow' }
        : input.mode === 'room_insert'
          ? { label: 'ROOM', suffix: 'room', subtitle: 'Room Fake Flow' }
          : { label: 'ENV', suffix: 'env', subtitle: 'Environment Fake Flow' };
    const variantLabel = `${modeConfig.label} ${input.variantIndex + 1}`;
    const overlay = Buffer.from(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <rect x="910" y="36" width="240" height="72" rx="18" fill="rgba(255,255,255,0.78)" />
        <rect x="930" y="54" width="18" height="18" rx="9" fill="${badgeHue}" />
        <text x="964" y="70" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#111111">${variantLabel}</text>
        <text x="964" y="95" font-family="Inter, Arial, sans-serif" font-size="18" fill="#6C6A66">${modeConfig.subtitle}</text>
      </svg>
    `);

    const modulationVariants =
      input.mode === 'material_edit'
        ? [
            { brightness: 1.01, saturation: 0.94 },
            { brightness: 0.98, saturation: 1.06 },
            { brightness: 0.97, saturation: 0.9 }
          ]
        : [
            { brightness: 1.02, saturation: 1.03 },
            { brightness: 0.99, saturation: 1.08 },
            { brightness: 1.01, saturation: 0.96 }
          ];
    const modulation = modulationVariants[input.variantIndex % modulationVariants.length];

    let generatedBuffer: Buffer;
    let metadata: sharp.Metadata;

    if (input.generatedAsset) {
      const providerImage = sharp(input.generatedAsset.bytes).rotate();
      metadata = await providerImage.metadata();
      generatedBuffer = await providerImage.png().toBuffer();
    } else if (input.mode === 'room_insert' && input.placement) {
      const roomImage = await this.getImage(input.placement.roomImageId);
      const roomBytes = await storage.readAsset(roomImage.filePath);
      const furnitureBuffer = await sharp(sourceBytes)
        .rotate()
        .resize({
          width: Math.max(1, input.placement.width),
          height: Math.max(1, input.placement.height),
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .modulate(modulation)
        .png()
        .toBuffer();
      const shadowWidth = Math.max(1, Math.round(input.placement.width * 0.68));
      const shadowHeight = Math.max(1, Math.round(input.placement.height * 0.12));
      const shadowLeft = Math.max(
        0,
        Math.round(input.placement.x + (input.placement.width - shadowWidth) / 2)
      );
      const shadowTop = Math.max(
        0,
        Math.round(input.placement.y + input.placement.height - shadowHeight / 2)
      );
      const shadow = Buffer.from(`
        <svg width="${shadowWidth}" height="${shadowHeight}" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="${shadowWidth / 2}" cy="${shadowHeight / 2}" rx="${shadowWidth / 2}" ry="${shadowHeight / 2}" fill="rgba(0,0,0,0.14)" />
        </svg>
      `);

      const baseImage = sharp(roomBytes)
        .rotate()
        .composite([
          { input: shadow, left: shadowLeft, top: shadowTop },
          {
            input: furnitureBuffer,
            left: Math.round(input.placement.x),
            top: Math.round(input.placement.y)
          },
          { input: overlay }
        ]);

      metadata = await baseImage.metadata();
      generatedBuffer = await baseImage.png().toBuffer();
    } else {
      const baseImage = sharp(sourceBytes)
        .rotate()
        .modulate(modulation)
        .composite([{ input: overlay }]);

      metadata = await baseImage.metadata();
      generatedBuffer = await baseImage.png().toBuffer();
    }

    const thumbnailBuffer = await sharp(generatedBuffer)
      .resize({
        width: 480,
        height: 480,
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    await storage.writeAsset(target.filePath, generatedBuffer);
    await storage.writeAsset(target.thumbnailPath, thumbnailBuffer);

    const originalBaseName =
      typeof sourceImage.settingsSnapshot?.originalFileName === 'string'
        ? sourceImage.settingsSnapshot.originalFileName
        : imageTitleFromPath(sourceImage.filePath);
    const roomBaseName =
      input.mode === 'room_insert' && input.placement
        ? imageTitleFromPath((await this.getImage(input.placement.roomImageId)).filePath)
        : null;

    const [image] = await db
      .insert(images)
      .values({
        id: imageId,
        projectId: sourceImage.projectId,
        userId: sourceImage.userId,
        parentImageId: sourceImage.id,
        generationId: input.generationId,
        type: 'generated',
        filePath: target.filePath,
        thumbnailPath: target.thumbnailPath,
        mimeType: 'image/png',
        width: metadata.width ?? sourceImage.width,
        height: metadata.height ?? sourceImage.height,
        placementX: input.mode === 'room_insert' && input.placement ? input.placement.x : null,
        placementY: input.mode === 'room_insert' && input.placement ? input.placement.y : null,
        placementWidth:
          input.mode === 'room_insert' && input.placement ? input.placement.width : null,
        placementHeight:
          input.mode === 'room_insert' && input.placement ? input.placement.height : null,
        promptSnapshot: input.promptSnapshot,
        settingsSnapshot: {
          ...input.settingsSnapshot,
          originalFileName:
            input.mode === 'room_insert' && roomBaseName
              ? `${originalBaseName}-in-${roomBaseName}-${input.variantIndex + 1}`
              : `${originalBaseName}-${modeConfig.suffix}-${input.variantIndex + 1}`,
          sourceImageId: sourceImage.id,
          roomImageId:
            input.mode === 'room_insert' && input.placement ? input.placement.roomImageId : null,
          fakeGeneration: input.generatedAsset ? false : true,
          provider: input.generatedAsset?.provider ?? 'dev-fake'
        }
      })
      .returning({
        id: images.id,
        parentImageId: images.parentImageId,
        thumbnailPath: images.thumbnailPath
      });

    await projectService.touchProject(sourceImage.projectId);

    return image;
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

  async deleteImage(id: string) {
    if (!isDatabaseConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const image = await this.getImage(id);
    const db = getDb();

    await db.delete(images).where(eq(images.id, id));

    await Promise.all([
      storage.deleteAsset(image.filePath),
      image.thumbnailPath ? storage.deleteAsset(image.thumbnailPath) : Promise.resolve()
    ]);

    await projectService.syncCoverImage(image.projectId);
    await projectService.touchProject(image.projectId);

    return {
      id: image.id,
      projectId: image.projectId
    };
  }
}

export const imageService = new ImageService();
