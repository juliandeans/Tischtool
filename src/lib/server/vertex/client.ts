import { serverConfig } from '$lib/server/config';

export class VertexClient {
  getConfiguration() {
    return {
      projectId: serverConfig.VERTEX_PROJECT_ID,
      location: serverConfig.VERTEX_LOCATION,
      model: serverConfig.VERTEX_MODEL,
      configured: Boolean(
        serverConfig.VERTEX_PROJECT_ID &&
        serverConfig.VERTEX_LOCATION &&
        serverConfig.VERTEX_MODEL &&
        serverConfig.GOOGLE_APPLICATION_CREDENTIALS
      )
    };
  }
}

export const vertexClient = new VertexClient();
