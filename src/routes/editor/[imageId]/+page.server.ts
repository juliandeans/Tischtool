import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { imageService } from '$lib/server/services/ImageService';
import { presetService } from '$lib/server/services/PresetService';
import { projectService } from '$lib/server/services/ProjectService';

const toPresetValue = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue');

export const load: PageServerLoad = async ({ params }) => {
  try {
    const image = await imageService.getEditorImage(params.imageId);
    const [project, variants, presets, parentImage] = await Promise.all([
      projectService.getProject(image.projectId),
      imageService.listChildVariants(image.id),
      presetService.listPresets(),
      image.parentImageId ? imageService.getEditorImage(image.parentImageId) : Promise.resolve(null)
    ]);

    return {
      image,
      project,
      variants,
      parentImage,
      styleOptions: presets
        .filter((preset) => preset.category === 'style')
        .map((preset) => ({
          value: toPresetValue(preset.name),
          label: preset.name
        })),
      lightOptions: presets
        .filter((preset) => preset.category === 'light')
        .map((preset) => ({
          value: toPresetValue(preset.name),
          label: preset.name
        }))
    };
  } catch {
    throw error(404, 'Bild für den Editor nicht gefunden.');
  }
};
