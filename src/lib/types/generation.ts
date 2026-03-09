import type { ImageModel } from '$lib/types/settings';

export type GenerationMode = 'environment_edit' | 'material_edit' | 'room_placement';
export type GenerationStatus = 'pending' | 'running' | 'succeeded' | 'failed';
export type StylePreset = 'original' | 'minimal' | 'warm' | 'modern';
export type LightPreset = 'original' | 'warm' | 'bright' | 'dramatic';
export type MaterialEditSubMode = 'surface' | 'form' | 'style';
export type RoomPreset =
  | 'none'
  | 'modern_living'
  | 'scandinavian'
  | 'landhaus'
  | 'loft'
  | 'office'
  | 'childrens_room';
export type ProtectionRuleKey = keyof ProtectionRules;

export type GenerationPlacement = {
  roomImageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type ProtectionRules = {
  preserveObject: boolean;
  preservePerspective: boolean;
  preserveCrop: boolean;
  noExtraFurniture: boolean;
  changesOnlyEnvironment: boolean;
};

export const DEFAULT_PROTECTION_RULES: ProtectionRules = {
  preserveObject: true,
  preservePerspective: true,
  preserveCrop: true,
  noExtraFurniture: true,
  changesOnlyEnvironment: true
};

export type GenerationProtectionRules = Partial<ProtectionRules>;

export type GenerationRuntimeOptions = {
  providerPreference?: 'real' | 'fake';
  providerDebugEnabled?: boolean;
  debugRunId?: string;
  imageModel?: ImageModel;
};

export interface GenerationRequest {
  mode: GenerationMode;
  userInput: string;
  stylePreset: StylePreset;
  lightPreset: LightPreset;
  roomPreset: RoomPreset;
  materialEditSubMode?: MaterialEditSubMode;
  protectionRules: ProtectionRules;
  variantsRequested: number;
}

export type CreateGenerationInput = {
  projectId: string;
  sourceImageId: string;
  mode: GenerationMode;
  userInput?: string;
  stylePreset: StylePreset;
  lightPreset: LightPreset;
  roomPreset?: RoomPreset;
  materialEditSubMode?: MaterialEditSubMode;
  protectionRules?: ProtectionRules;
  variantsRequested: number;
  targetMaterial: string | null;
  surfaceDescription: string;
  preserveObject: boolean;
  preservePerspective: boolean;
  placement: GenerationPlacement;
  instructions?: string;
};

export type PromptPresetEffect = {
  label: string;
  value: string;
  appliedFragment: string;
};

export type PromptProtectionRuleDebug = {
  key: ProtectionRuleKey;
  label: string;
  enabled: boolean;
  appliedFragment: string | null;
};

export type PromptDebugEntry = {
  label: string;
  value: string;
};

export type PromptInstructionDebug = {
  rawInput: string;
  normalizedLines: string[];
};

export type ProviderRequestType = 'edit' | 'generate';
export type ProviderFlow = 'vertex' | 'dev-fake';

export type Base64DebugSummary = {
  length: number | null;
  prefix: string | null;
  suffix: string | null;
  hasDataUrlPrefix: boolean;
};

export type BinaryAssetDebug = {
  label: string;
  mimeType: string | null;
  byteLength: number | null;
  base64: Base64DebugSummary | null;
  sha256: string | null;
};

export type ProviderPredictionDebug = {
  index: number;
  fieldsPresent: string[];
  selectedImageField: string | null;
  mimeType: string | null;
  base64: Base64DebugSummary | null;
  decodedByteLength: number | null;
  sha256: string | null;
  decodeSucceeded: boolean;
  decodeError: string | null;
};

export type ProviderArtifactDebug = {
  label: string;
  relativePath: string;
  mimeType: string | null;
  byteLength: number | null;
  sha256: string | null;
};

export type StorageTransformDebug = {
  functionPath: string;
  reencoded: boolean;
  sourceMimeType: string | null;
  sourceByteLength: number | null;
  sourceSha256: string | null;
  sourceMetadata: Record<string, unknown> | null;
  outputMimeType: string | null;
  outputByteLength: number | null;
  outputSha256: string | null;
  outputMetadata: Record<string, unknown> | null;
  orientationApplied: boolean;
  bytesChanged: boolean;
  reasons: string[];
};

export type PersistedImageDebug = {
  imageId: string;
  relativeFilePath: string;
  relativeThumbnailPath: string | null;
  editorUrl: string;
  downloadUrl: string;
  displayedViaDownloadRoute: string;
  mimeType: string;
  storedByteLength: number | null;
  storedSha256: string | null;
  providerOutputSha256: string | null;
  providerOutputByteLength: number | null;
  storedMatchesProvider: boolean | null;
  storedMatchesProviderReason: string | null;
  displayedOutputSha256: string | null;
  displayedMatchesStored: boolean | null;
  storageTransform: StorageTransformDebug | null;
};

export type ProviderDebugRequest = {
  runId: string;
  mode: GenerationMode;
  provider: string;
  model: string;
  configured: boolean;
  preferredFlow: 'real' | 'fake';
  plannedFlow: ProviderFlow;
  fallbackReason: string | null;
  requestType: ProviderRequestType;
  requestEndpoint: 'predict' | 'generateContent' | 'dev-fake';
  endpointUrl: string | null;
  negativePromptText: string | null;
  sourceImageIncluded: boolean;
  maskIncluded: boolean;
  targetRegionIncluded: boolean;
  sampleCount: number;
  editStrategy: string;
  modelHint: string | null;
  sourceImage: BinaryAssetDebug | null;
  maskImage: BinaryAssetDebug | null;
  requestBody: Record<string, unknown>;
  providerParameters: Record<string, unknown>;
  decisionFlags: Record<string, boolean | number | string | null>;
};

export type ProviderDebugRun = {
  runId: string;
  usedFlow: ProviderFlow;
  model: string;
  requestType: ProviderRequestType;
  requestEndpoint: 'predict' | 'generateContent' | 'dev-fake';
  endpointUrl: string | null;
  sourceImageIncluded: boolean;
  maskIncluded: boolean;
  targetRegionIncluded: boolean;
  sampleCount: number;
  fakeFallbackUsed: boolean;
  fallbackReason: string | null;
  responseStatus: number | null;
  predictionsCount: number | null;
  outputMimeTypes: string[];
  outputByteSizes: number[];
  totalOutputBytes: number | null;
  responseMetadata: Record<string, unknown> | null;
  responseRootKeys: string[];
  rawResponsePreview: string | null;
  predictions: ProviderPredictionDebug[];
  artifacts: ProviderArtifactDebug[];
  persistedImages: PersistedImageDebug[];
  editStrategy: string;
  modelHint: string | null;
  error: string | null;
};

export type PromptDebugPreview = {
  mode: GenerationMode;
  modeLabel: string;
  systemPromptText: string;
  promptText: string;
  fullPromptText: string;
  presetEffects: PromptPresetEffect[];
  protectionRules: PromptProtectionRuleDebug[];
  modeParameters: PromptDebugEntry[];
  instructionDebug: PromptInstructionDebug;
  requestPreview: {
    provider: string;
    model: string;
    configured: boolean;
    projectId: string;
    sourceImageId: string;
    variantsRequested: number;
    placement: GenerationPlacement;
    payload: Record<string, unknown>;
  };
  providerDebug: {
    request: ProviderDebugRequest;
    run: ProviderDebugRun | null;
  };
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
