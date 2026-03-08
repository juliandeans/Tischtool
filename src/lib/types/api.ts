import type { CostLogListItem, CostSummary } from '$lib/types/cost';
import type {
  CreateGenerationInput,
  GenerationSummary,
  PromptDebugPreview
} from '$lib/types/generation';
import type { ImageDetail, ImageSummary } from '$lib/types/image';
import type { PresetSummary } from '$lib/types/preset';
import type { CreateProjectInput, ProjectDetail, ProjectSummary } from '$lib/types/project';
import type { ProviderSettingsSnapshot, ProviderStatusSnapshot } from '$lib/types/settings';

export type ApiErrorPayload = {
  error: string;
  details?: Record<string, unknown>;
};

export type GetProjectsResponse = {
  projects: ProjectSummary[];
};

export type PostProjectRequest = CreateProjectInput;

export type PostProjectResponse = {
  project: Pick<ProjectSummary, 'id' | 'name'>;
};

export type GetProjectResponse = {
  project: ProjectDetail;
};

export type GetProjectImagesResponse = {
  images: Pick<ImageSummary, 'id' | 'projectId' | 'parentImageId' | 'thumbnailPath'>[];
};

export type PostUploadResponse = {
  image: Pick<ImageSummary, 'id' | 'projectId' | 'type' | 'filePath'>;
};

export type GetImageResponse = {
  image: ImageDetail;
};

export type PostGenerationRequest = CreateGenerationInput;

export type PostGenerationResponse = {
  generation: Pick<GenerationSummary, 'id' | 'status' | 'variantsReturned'>;
  images: Pick<ImageSummary, 'id' | 'parentImageId' | 'thumbnailPath'>[];
  promptDebug: PromptDebugPreview;
};

export type PostGenerationPreviewRequest = CreateGenerationInput;

export type PostGenerationPreviewResponse = {
  promptDebug: PromptDebugPreview;
};

export type GetCostsSummaryResponse = CostSummary;

export type GetCostLogsResponse = {
  logs: CostLogListItem[];
};

export type GetPresetsResponse = {
  presets: PresetSummary[];
};

export type GetProviderStatusResponse = {
  settings: ProviderSettingsSnapshot;
  status: ProviderStatusSnapshot;
};
