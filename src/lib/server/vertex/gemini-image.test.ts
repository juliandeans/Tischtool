import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  callGeminiImageEdit,
  GEMINI_25_FLASH_IMAGE_MODEL,
  GEMINI_FLASH_IMAGE_MODEL
} from '$lib/server/vertex/gemini-image';

describe('callGeminiImageEdit', () => {
  const createSourceImageBase64 = async () => {
    const buffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 240, g: 200, b: 120 }
      }
    })
      .jpeg()
      .toBuffer();

    return buffer.toString('base64');
  };

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

    const sourceImageBase64 = await createSourceImageBase64();
    const input = {
      sourceImageBase64,
      sourceImageMimeType: 'image/jpeg',
      promptText: 'Bearbeite das Bild.'
    };

    const result = await callGeminiImageEdit(
      input,
      'project-123',
      'token-abc',
      GEMINI_FLASH_IMAGE_MODEL
    );

    expect(result).toEqual({
      imageBase64: 'ZmFrZS1pbWFnZQ==',
      mimeType: 'image/png',
      text: 'done'
    });
    const fetchCall = fetchMock.mock.calls[0];
    const body = JSON.parse(fetchCall?.[1]?.body as string);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://aiplatform.googleapis.com/v1/projects/project-123/locations/global/publishers/google/models/${GEMINI_FLASH_IMAGE_MODEL}:generateContent`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'Content-Type': 'application/json'
        })
      })
    );
    expect(body.generationConfig).toEqual({
      responseModalities: ['TEXT', 'IMAGE']
    });
    expect(body.contents[0].parts[0].inlineData.mimeType).toBe('image/jpeg');
    expect(body.contents[0].parts[0].inlineData.data).not.toBe(sourceImageBase64);
    expect(body.contents[0].parts[1].text).toBe(input.promptText);
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

    const sourceImageBase64 = await createSourceImageBase64();
    await expect(
      callGeminiImageEdit(
        {
          sourceImageBase64,
          sourceImageMimeType: 'image/jpeg',
          promptText: 'Bearbeite das Bild.'
        },
        'project-123',
        'token-abc'
      )
    ).rejects.toThrow('Gemini response does not contain an image part.');
  });

  it('uses the Gemini 2.5 Flash Image model endpoint when requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
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

    const sourceImageBase64 = await createSourceImageBase64();

    await callGeminiImageEdit(
      {
        sourceImageBase64,
        sourceImageMimeType: 'image/jpeg',
        promptText: 'Bearbeite das Bild.'
      },
      'project-123',
      'token-abc',
      GEMINI_25_FLASH_IMAGE_MODEL
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `https://aiplatform.googleapis.com/v1/projects/project-123/locations/global/publishers/google/models/${GEMINI_25_FLASH_IMAGE_MODEL}:generateContent`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'Content-Type': 'application/json'
        })
      })
    );
  });
});
