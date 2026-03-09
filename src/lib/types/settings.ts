export type ProviderFlowPreference = 'real' | 'fake';
export type ImageModel = 'imagen-3' | 'gemini-3-pro-image';

export type ProviderSettingsSnapshot = {
  vertexProjectId: string;
  vertexLocation: string;
  vertexModel: string;
  imageModel: ImageModel;
  providerPreference: ProviderFlowPreference;
  providerDebugEnabled: boolean;
  credentialsMode: 'adc' | 'service-account-file';
};

export type ProviderStatusSnapshot = {
  configComplete: boolean;
  authAvailable: boolean;
  preferredFlow: ProviderFlowPreference;
  effectiveFlow: 'vertex' | 'dev-fake';
  canUseVertex: boolean;
  fallbackReason: string | null;
  authMessage: string;
  statusMessage: string;
  checkedAt: string;
};
