import { readFile } from 'node:fs/promises';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { imageService } from '$lib/server/services/ImageService';

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

  return new Response(fileBuffer, {
    headers: {
      'content-disposition': shouldDownload
        ? `attachment; filename="${download.fileName}"`
        : `inline; filename="${download.fileName}"`,
      'content-type': download.mimeType
    }
  });
};
