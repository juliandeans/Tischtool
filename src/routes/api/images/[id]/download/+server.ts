import { readFile } from 'node:fs/promises';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { imageService } from '$lib/server/services/ImageService';
import { sha256Hex } from '$lib/server/vertex/debug';

export const GET: RequestHandler = async ({ params, url }) => {
  const variant = (url.searchParams.get('variant') === 'thumbnail' ? 'thumbnail' : 'original') as
    | 'original'
    | 'thumbnail';
  const shouldDownload = url.searchParams.get('download') === '1';
  const download = await imageService.getDownloadDescriptor(params.id, variant);

  if (!download.exists || download.driver !== 'local') {
    throw error(501, 'Download skeleton exists, but no stored file is available yet.');
  }

  const fileBuffer = await readFile(download.filePath);

  if (download.debugRunId) {
    console.info(
      `[vertex-debug][${download.debugRunId}][image-delivery] ${JSON.stringify(
        {
          imageId: params.id,
          variant,
          servedFilePath: download.filePath,
          mimeType: download.mimeType,
          byteLength: fileBuffer.byteLength,
          sha256: sha256Hex(new Uint8Array(fileBuffer))
        },
        null,
        2
      )}`
    );
  }

  return new Response(fileBuffer, {
    headers: {
      'content-disposition': shouldDownload
        ? `attachment; filename="${download.fileName}"`
        : `inline; filename="${download.fileName}"`,
      'content-type': download.mimeType
    }
  });
};
