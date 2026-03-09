import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildGeminiImageEditPayload,
  callGeminiImageEdit,
  GEMINI_IMAGE_MODEL
} from '$lib/server/vertex/gemini-image';

describe('callGeminiImageEdit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the first inline image part and optional text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: 'done' },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'ZmFrZS1pbWFnZQ=='
                  }
                }
              ]
            }
          }
        ]
      })
    });

    vi.stubGlobal('fetch', fetchMock);

    const input = {
      sourceImageBase64: 'c291cmNlLWltYWdl',
      sourceImageMimeType: 'image/jpeg',
      promptText: 'Bearbeite das Bild.'
    };

    const result = await callGeminiImageEdit(input, 'project-123', 'token-abc');

    expect(result).toEqual({
      imageBase64: 'ZmFrZS1pbWFnZQ==',
      mimeType: 'image/png',
      text: 'done'
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://aiplatform.googleapis.com/v1/projects/project-123/locations/global/publishers/google/models/${GEMINI_IMAGE_MODEL}:generateContent`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(buildGeminiImageEditPayload(input))
      })
    );
  });

  it('throws a clear error when no image part exists in the response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'only text' }]
              }
            }
          ]
        })
      })
    );

    await expect(
      callGeminiImageEdit(
        {
          sourceImageBase64: 'c291cmNlLWltYWdl',
          sourceImageMimeType: 'image/jpeg',
          promptText: 'Bearbeite das Bild.'
        },
        'project-123',
        'token-abc'
      )
    ).rejects.toThrow('Gemini response does not contain an image part.');
  });
});
