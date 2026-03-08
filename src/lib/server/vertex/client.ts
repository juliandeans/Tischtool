import { GoogleAuth } from 'google-auth-library';

import { getVertexRuntimeConfig } from '$lib/server/config';

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

export type VertexConfiguration = {
  projectId: string;
  location: string;
  model: string;
  credentialsPath: string;
  configured: boolean;
};

export class VertexClient {
  getConfiguration(): VertexConfiguration {
    const config = getVertexRuntimeConfig();

    return {
      projectId: config.projectId,
      location: config.location,
      model: config.model,
      credentialsPath: config.credentialsPath,
      configured: config.configured
    };
  }

  private createAuthClient() {
    const configuration = this.getConfiguration();

    return new GoogleAuth({
      scopes: [CLOUD_PLATFORM_SCOPE],
      // Use the configured service account file directly when present instead of relying on ambient ADC only.
      keyFilename: configuration.credentialsPath || undefined
    });
  }

  getPredictUrl(model = this.getConfiguration().model) {
    const config = this.getConfiguration();

    return `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${model}:predict`;
  }

  async getAccessToken() {
    // Prefer the configured service account file when present; otherwise fall back to ambient ADC.
    const client = await this.createAuthClient().getClient();
    const token = await client.getAccessToken();
    const accessToken = typeof token === 'string' ? token : token?.token;

    if (!accessToken) {
      throw new Error('Vertex access token could not be resolved from ADC.');
    }

    return accessToken;
  }
}

export const vertexClient = new VertexClient();
