export type ImageType = 'original' | 'generated' | 'upload';

export type ImageSummary = {
  id: string;
  projectId: string;
  userId: string;
  parentImageId: string | null;
  generationId: string | null;
  type: ImageType;
  filePath: string;
  thumbnailPath: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export type ImagePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageDetail = ImageSummary & {
  placement: ImagePlacement | null;
  promptSnapshot: Record<string, unknown> | null;
  settingsSnapshot: Record<string, unknown> | null;
};

export type UploadImageInput = {
  projectId: string;
  type: ImageType;
  fileName: string;
  mimeType: string;
};
