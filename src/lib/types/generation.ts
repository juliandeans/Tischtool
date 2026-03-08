export type GenerationMode = 'environment_edit' | 'material_edit' | 'room_insert';
export type GenerationStatus = 'pending' | 'running' | 'succeeded' | 'failed';
export type ProtectionRuleKey =
  | 'preserveObject'
  | 'preservePerspective'
  | 'preserveFrame'
  | 'noExtraFurniture'
  | 'changeEnvironmentFirst'
  | 'preserveForm'
  | 'preserveConstruction'
  | 'preserveBackground'
  | 'preserveLight'
  | 'adaptLighting';

export type GenerationPlacement = {
  roomImageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type GenerationProtectionRules = Partial<Record<ProtectionRuleKey, boolean>>;

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
  protectionRules?: GenerationProtectionRules;
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

export type PromptDebugPreview = {
  mode: GenerationMode;
  modeLabel: string;
  systemPromptText: string;
  promptText: string;
  fullPromptText: string;
  presetEffects: PromptPresetEffect[];
  protectionRules: PromptProtectionRuleDebug[];
  modeParameters: PromptDebugEntry[];
  requestPreview: {
    provider: string;
    model: string;
    configured: boolean;
    projectId: string;
    sourceImageId: string;
    variantsRequested: number;
    placement: GenerationPlacement;
    payload: {
      mode: GenerationMode;
      promptText: string;
      variantsRequested: number;
    };
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
