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
  private auth = new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE]
  });

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

  getPredictUrl(model = this.getConfiguration().model) {
    const config = this.getConfiguration();

    return `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${model}:predict`;
  }

  async getAccessToken() {
    // GoogleAuth uses ADC automatically and honors GOOGLE_APPLICATION_CREDENTIALS when set.
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    const accessToken = typeof token === 'string' ? token : token?.token;

    if (!accessToken) {
      throw new Error('Vertex access token could not be resolved from ADC.');
    }

    return accessToken;
  }
}

export const vertexClient = new VertexClient();
