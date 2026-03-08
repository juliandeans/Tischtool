import type { ImageDetail, ImageSummary, UploadImageInput } from '$lib/types/image';

import { storage } from '$lib/server/storage';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export class ImageService {
  async listProjectImages(projectId: string) {
    return [
      {
        id: '30000000-0000-0000-0000-000000000001',
        projectId,
        parentImageId: null,
        thumbnailPath: `${projectId}/thumb-placeholder.jpg`
      }
    ];
  }

  async getImage(id: string): Promise<ImageDetail> {
    return {
      id,
      projectId: '10000000-0000-0000-0000-000000000001',
      userId: DEMO_USER_ID,
      parentImageId: null,
      generationId: null,
      type: 'upload',
      filePath: `${id}.jpg`,
      thumbnailPath: `${id}-thumb.jpg`,
      mimeType: 'image/jpeg',
      width: null,
      height: null,
      placement: null,
      promptSnapshot: null,
      settingsSnapshot: null,
      createdAt: new Date('2026-03-08T12:00:00.000Z').toISOString()
    };
  }

  async createUploadSkeleton(
    input: UploadImageInput
  ): Promise<Pick<ImageSummary, 'id' | 'projectId' | 'type' | 'filePath'>> {
    const target = await storage.prepareUploadTarget(input.fileName);

    return {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      type: input.type,
      filePath: target.filePath
    };
  }

  async getDownloadDescriptor(id: string) {
    const image = await this.getImage(id);
    return storage.resolveDownload(image.filePath);
  }
}

export const imageService = new ImageService();
