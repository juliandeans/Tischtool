export type ProviderFlowPreference = "real" | "fake";
export type ImageModel =
  | "imagen-3"
  | "gemini-3-pro-image"
  | "gemini-3.1-flash-image-preview"
  | "gemini-2.5-flash-image-preview"
  | "flux-2-pro"
  | "flux-2-pro-preview"
  | "gpt-image-1";

export type ProviderSettingsSnapshot = {
  vertexProjectId: string;
  vertexLocation: string;
  vertexModel: string;
  imageModel: ImageModel;
  providerPreference: ProviderFlowPreference;
  providerDebugEnabled: boolean;
  credentialsMode: "adc" | "service-account-file";
};

export type ProviderStatusSnapshot = {
  configComplete: boolean;
  authAvailable: boolean;
  preferredFlow: ProviderFlowPreference;
  effectiveFlow: "vertex" | "dev-fake";
  canUseVertex: boolean;
  fallbackReason: string | null;
  authMessage: string;
  statusMessage: string;
  checkedAt: string;
};
