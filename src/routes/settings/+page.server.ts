import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { providerStatusService } from '$lib/server/services/ProviderStatusService';
import { writeProviderPreferences } from '$lib/server/provider-settings';
import type { ImageModel, ProviderFlowPreference } from '$lib/types/settings';

const isProviderPreference = (value: string): value is ProviderFlowPreference =>
  value === 'real' || value === 'fake';

const isImageModel = (value: string): value is ImageModel =>
  value === 'imagen-3' || value === 'gemini-3-pro-image';

export const load: PageServerLoad = async ({ cookies }) => {
  const snapshot = await providerStatusService.getSnapshot(cookies);

  return {
    providerSettings: snapshot.settings,
    providerStatus: snapshot.status,
    credentialsHint: providerStatusService.getCredentialsHint()
  };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const providerPreference = String(formData.get('providerPreference') ?? '');
    const providerDebugEnabled = formData.get('providerDebugEnabled') === 'on';
    const imageModel = String(formData.get('imageModel') ?? '');

    if (!isProviderPreference(providerPreference)) {
      return fail(400, {
        error: 'Ungültige Provider-Präferenz.'
      });
    }

    if (!isImageModel(imageModel)) {
      return fail(400, {
        error: 'Ungültiges Bildmodell.'
      });
    }

    writeProviderPreferences(cookies, {
      providerPreference,
      providerDebugEnabled,
      imageModel
    });

    return {
      success: true
    };
  }
};
