import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { callFluxImageEdit } from '$lib/server/flux/image';

vi.mock('$env/dynamic/private', () => ({
  env: {
    BFL_API_KEY: 'bfl-test-key'
  }
}));

describe('callFluxImageEdit', () => {
  const createImageBuffer = () =>
    sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 180, g: 160, b: 120 }
      }
    })
      .jpeg()
      .toBuffer();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates, polls and downloads a finished FLUX image', async () => {
    const sampleBuffer = await createImageBuffer();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          polling_url: 'https://api.bfl.ai/v1/get_result?id=job-123'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'Ready',
          result: {
            sample: 'https://cdn.bfl.ai/result.jpg'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () =>
          sampleBuffer.buffer.slice(
            sampleBuffer.byteOffset,
            sampleBuffer.byteOffset + sampleBuffer.byteLength
          )
      });

    vi.stubGlobal('fetch', fetchMock);

    const sourceImageBuffer = await createImageBuffer();
    const result = await callFluxImageEdit(
      {
        sourceImageBuffer,
        sourceImageMimeType: 'image/jpeg',
        promptText: 'Bearbeite das Bild.'
      },
      'flux-2-pro'
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.bfl.ai/v1/flux-2-pro',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-key': 'bfl-test-key'
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.bfl.ai/v1/get_result?id=job-123',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'x-key': 'bfl-test-key'
        }
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://cdn.bfl.ai/result.jpg'
    );
    expect(result.mimeType).toBe('image/png');
    expect(result.imageBase64.length).toBeGreaterThan(0);
  });

  it('throws a clear error when FLUX reports status Error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          polling_url: 'https://api.bfl.ai/v1/get_result?id=job-123'
        })
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'Error',
          detail: 'Safety system blocked the request.'
        })
      });

    vi.stubGlobal('fetch', fetchMock);

    const sourceImageBuffer = await createImageBuffer();
    await expect(
      callFluxImageEdit(
        {
          sourceImageBuffer,
          sourceImageMimeType: 'image/jpeg',
          promptText: 'Bearbeite das Bild.'
        },
        'flux-2-pro-preview'
      )
    ).rejects.toThrow('Safety system blocked the request.');
  });
});
