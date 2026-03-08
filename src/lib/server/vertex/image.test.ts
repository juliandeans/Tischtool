import { describe, expect, it } from 'vitest';

import {
  buildEnvironmentEditVertexPayload,
  parseVertexImageResponse,
  VertexProviderError
} from '$lib/server/vertex/image';

describe('vertex image helpers', () => {
  it('builds an environment_edit payload with a reference image and sampleCount', () => {
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
              referenceType: 'REFERENCE_TYPE_RAW',
              referenceId: 1,
              referenceImage: {
                bytesBase64Encoded: 'ZmFrZS1iYXNlNjQ='
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
