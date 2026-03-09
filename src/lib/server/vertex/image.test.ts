import { describe, expect, it } from 'vitest';

import { vertexClient } from '$lib/server/vertex/client';
import {
  buildEnvironmentEditVertexPayload,
  parseVertexImageResponse,
  VertexProviderError,
  vertexImageService
} from '$lib/server/vertex/image';

describe('vertex image helpers', () => {
  it('builds an environment_edit payload with subject image config and sample count only', () => {
    const payload = buildEnvironmentEditVertexPayload(
      {
        projectId: 'project-1',
        sourceImageId: 'image-1',
        mode: 'environment_edit',
        variantsRequested: 3,
        stylePreset: 'wohnlich',
        lightPreset: 'abendlicht',
        instructions: 'gelbe Wand',
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: true,
        preservePerspective: true,
        placement: null
      },
      'Kontext:\n- Testprompt',
      'ZmFrZS1iYXNlNjQ='
    );

    expect(payload).toEqual({
      instances: [
        {
          prompt: 'Kontext:\n- Testprompt',
          referenceImages: [
            {
              referenceType: 'REFERENCE_TYPE_SUBJECT',
              referenceId: 1,
              referenceImage: {
                bytesBase64Encoded: 'ZmFrZS1iYXNlNjQ='
              },
              subjectImageConfig: {
                subjectType: 'SUBJECT_TYPE_PRODUCT',
                subjectDescription: 'furniture piece'
              }
            }
          ]
        }
      ],
      parameters: {
        sampleCount: 3
      }
    });
  });

  it('models environment_edit as a subject-based request with sample count only', () => {
    const request = vertexImageService.prepareRequest(
      {
        projectId: 'project-1',
        sourceImageId: 'image-1',
        mode: 'environment_edit',
        variantsRequested: 2,
        stylePreset: 'wohnlich',
        lightPreset: 'abendlicht',
        instructions: 'gelbe Wand',
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: true,
        preservePerspective: true,
        placement: null
      },
      'Kontext:\n- Testprompt',
      {
        providerPreference: 'real'
      }
    );

    expect(request.providerDebug.requestType).toBe('edit');
    expect(request.providerDebug.sourceImageIncluded).toBe(true);
    expect(request.providerDebug.maskIncluded).toBe(true);
    expect(request.providerDebug.targetRegionIncluded).toBe(false);
    expect(request.providerDebug.sampleCount).toBe(2);
    expect(request.payload.parameters).toEqual({
      sampleCount: 2
    });
  });

  it('normalizes google-prefixed model ids for the Vertex endpoint', () => {
    expect(vertexClient.getPredictUrl('google/imagen-3.0-capability-001')).toContain(
      '/publishers/google/models/imagen-3.0-capability-001:predict'
    );
    expect(
      vertexClient.getPredictUrl('publishers/google/models/imagen-3.0-capability-001')
    ).toContain('/publishers/google/models/imagen-3.0-capability-001:predict');
  });

  it('parses base64 predictions into binary images', () => {
    const images = parseVertexImageResponse({
      predictions: [
        {
          mimeType: 'image/png',
          bytesBase64Encoded: Buffer.from('fake-image').toString('base64')
        }
      ]
    });

    expect(Buffer.from(images[0].bytes).toString()).toBe('fake-image');
    expect(images[0].mimeType).toBe('image/png');
  });

  it('throws a typed error when the vertex response contains no image payload', () => {
    expect(() => parseVertexImageResponse({ predictions: [{ mimeType: 'image/png' }] })).toThrow(
      VertexProviderError
    );
  });
});
