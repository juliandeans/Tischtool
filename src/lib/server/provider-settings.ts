import type { Cookies } from '@sveltejs/kit';

import type { ProviderFlowPreference } from '$lib/types/settings';

export const PROVIDER_PREFERENCE_COOKIE = 'tt-provider-preference';
export const PROVIDER_DEBUG_COOKIE = 'tt-provider-debug';

const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
  sameSite: 'lax' as const,
  secure: false
};

export const readProviderPreference = (cookies: Cookies): ProviderFlowPreference =>
  cookies.get(PROVIDER_PREFERENCE_COOKIE) === 'fake' ? 'fake' : 'real';

export const readProviderDebugEnabled = (cookies: Cookies) =>
  cookies.get(PROVIDER_DEBUG_COOKIE) === '1';

export const writeProviderPreferences = (
  cookies: Cookies,
  input: {
    providerPreference: ProviderFlowPreference;
    providerDebugEnabled: boolean;
  }
) => {
  cookies.set(PROVIDER_PREFERENCE_COOKIE, input.providerPreference, COOKIE_OPTIONS);
  cookies.set(PROVIDER_DEBUG_COOKIE, input.providerDebugEnabled ? '1' : '0', COOKIE_OPTIONS);
};
