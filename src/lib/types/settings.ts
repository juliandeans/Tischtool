export type ProviderFlowPreference = 'real' | 'fake';

export type ProviderSettingsSnapshot = {
  vertexProjectId: string;
  vertexLocation: string;
  vertexModel: string;
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
