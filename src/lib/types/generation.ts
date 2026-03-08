export type GenerationMode = 'environment_edit' | 'material_edit' | 'room_insert';
export type GenerationStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export type GenerationPlacement = {
  roomImageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type CreateGenerationInput = {
  projectId: string;
  sourceImageId: string;
  mode: GenerationMode;
  variantsRequested: number;
  stylePreset: string;
  lightPreset: string;
  instructions: string;
  targetMaterial: string | null;
  surfaceDescription: string;
  preserveObject: boolean;
  preservePerspective: boolean;
  placement: GenerationPlacement;
};

export type GenerationSummary = {
  id: string;
  projectId: string;
  userId: string;
  sourceImageId: string;
  provider: string;
  model: string;
  mode: GenerationMode;
  promptText: string;
  systemPromptText: string | null;
  settingsJson: Record<string, unknown> | null;
  variantsRequested: number;
  variantsReturned: number;
  usageJson: Record<string, unknown> | null;
  estimatedCost: number | null;
  actualCost: number | null;
  status: GenerationStatus;
  createdAt: string;
};
