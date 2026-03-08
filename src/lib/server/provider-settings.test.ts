import { describe, expect, it } from 'vitest';

import {
  PROVIDER_DEBUG_COOKIE,
  PROVIDER_PREFERENCE_COOKIE,
  readProviderDebugEnabled,
  readProviderPreference
} from '$lib/server/provider-settings';

const createCookieStore = (values: Record<string, string> = {}) => ({
  get: (name: string) => values[name]
});

describe('provider settings cookies', () => {
  it('defaults to real provider and disabled debug', () => {
    const cookies = createCookieStore();

    expect(readProviderPreference(cookies as never)).toBe('real');
    expect(readProviderDebugEnabled(cookies as never)).toBe(false);
  });

  it('reads fake preference and debug toggle from cookies', () => {
    const cookies = createCookieStore({
      [PROVIDER_PREFERENCE_COOKIE]: 'fake',
      [PROVIDER_DEBUG_COOKIE]: '1'
    });

    expect(readProviderPreference(cookies as never)).toBe('fake');
    expect(readProviderDebugEnabled(cookies as never)).toBe(true);
  });
});
