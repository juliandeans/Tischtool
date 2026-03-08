import { readFile } from 'node:fs/promises';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { imageService } from '$lib/server/services/ImageService';

export const GET: RequestHandler = async ({ params }) => {
  const download = await imageService.getDownloadDescriptor(params.id);

  if (!download.exists || download.driver !== 'local') {
    throw error(501, 'Download skeleton exists, but no stored file is available yet.');
  }

  const fileBuffer = await readFile(download.filePath);

  return new Response(fileBuffer, {
    headers: {
      'content-type': 'application/octet-stream'
    }
  });
};
