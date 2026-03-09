import type { Cookies } from '@sveltejs/kit';

import { serverConfig } from '$lib/server/config';
import {
  readImageModel,
  readProviderDebugEnabled,
  readProviderPreference
} from '$lib/server/provider-settings';
import { vertexClient } from '$lib/server/vertex/client';
import type { ProviderSettingsSnapshot, ProviderStatusSnapshot } from '$lib/types/settings';

const resolveAuthAvailability = async () => {
  try {
    await Promise.race([
      vertexClient.getAccessToken(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ADC check timed out.')), 1500)
      )
    ]);

    return {
      authAvailable: true,
      authMessage: 'ADC ist serverseitig verfügbar.'
    };
  } catch (error) {
    return {
      authAvailable: false,
      authMessage:
        error instanceof Error ? error.message : 'ADC konnte serverseitig nicht geprüft werden.'
    };
  }
};

export class ProviderStatusService {
  async getSnapshot(cookies: Cookies): Promise<{
    settings: ProviderSettingsSnapshot;
    status: ProviderStatusSnapshot;
  }> {
    const configuration = vertexClient.getConfiguration();
    const providerPreference = readProviderPreference(cookies);
    const providerDebugEnabled = readProviderDebugEnabled(cookies);
    const imageModel = readImageModel(cookies);
    const settings: ProviderSettingsSnapshot = {
      vertexProjectId: configuration.projectId,
      vertexLocation: configuration.location,
      vertexModel: configuration.model,
      imageModel,
      providerPreference,
      providerDebugEnabled,
      credentialsMode: configuration.credentialsPath ? 'service-account-file' : 'adc'
    };

    if (!configuration.configured) {
      return {
        settings,
        status: {
          configComplete: false,
          authAvailable: false,
          preferredFlow: providerPreference,
          effectiveFlow: 'dev-fake',
          canUseVertex: false,
          fallbackReason: 'Vertex Project ID, Location oder Model fehlen serverseitig.',
          authMessage: 'ADC wird erst geprüft, wenn die Vertex-Konfiguration vollständig ist.',
          statusMessage: 'Fake-Flow aktiv, weil die Vertex-Konfiguration unvollständig ist.',
          checkedAt: new Date().toISOString()
        }
      };
    }

    const auth = await resolveAuthAvailability();
    const fakePreferred = providerPreference === 'fake';
    const canUseVertex = auth.authAvailable && !fakePreferred;

    return {
      settings,
      status: {
        configComplete: true,
        authAvailable: auth.authAvailable,
        preferredFlow: providerPreference,
        effectiveFlow: canUseVertex ? 'vertex' : 'dev-fake',
        canUseVertex,
        fallbackReason: canUseVertex
          ? null
          : fakePreferred
            ? 'Fake-Flow ist in den Settings bevorzugt.'
            : 'Vertex ist konfiguriert, aber ADC ist serverseitig nicht verfügbar.',
        authMessage: auth.authMessage,
        statusMessage: canUseVertex
          ? 'Echter Vertex-Flow kann verwendet werden.'
          : fakePreferred
            ? 'Fake-Flow bleibt aktiv, weil er in den Settings bevorzugt ist.'
            : 'Fake-Fallback bleibt aktiv, bis ADC serverseitig funktioniert.',
        checkedAt: new Date().toISOString()
      }
    };
  }

  getCredentialsHint() {
    return serverConfig.GOOGLE_APPLICATION_CREDENTIALS
      ? 'Credentials werden serverseitig über GOOGLE_APPLICATION_CREDENTIALS geladen.'
      : 'Credentials laufen serverseitig über ADC. Im Browser werden keine Secrets gespeichert.';
  }
}

export const providerStatusService = new ProviderStatusService();
