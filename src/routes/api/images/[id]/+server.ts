import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type {
  GetImageResponse,
  PatchImageTitleRequest,
  PatchImageTitleResponse
} from '$lib/types/api';
import { imageService } from '$lib/server/services/ImageService';

export const GET: RequestHandler = async ({ params }) => {
  const image = await imageService.getImage(params.id);
  const body: GetImageResponse = { image };

  return json(body);
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const deletedImage = await imageService.deleteImage(params.id);

    return json({
      deletedImage
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Bild konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const body = (await request.json()) as Partial<PatchImageTitleRequest>;
    const image = await imageService.updateImageTitle(params.id, body.title ?? '');
    const payload: PatchImageTitleResponse = { image };

    return json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Bildname konnte nicht aktualisiert werden.';
    const status = message === 'Bildname darf nicht leer sein.' ? 400 : 500;

    return json(
      {
        error: message
      },
      { status }
    );
  }
};
