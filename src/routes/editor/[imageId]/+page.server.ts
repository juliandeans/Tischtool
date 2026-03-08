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

const readString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

const readMode = (value: unknown): 'environment_edit' | 'material_edit' =>
  value === 'material_edit' ? 'material_edit' : 'environment_edit';

const readVariants = (value: unknown) =>
  typeof value === 'number' && value >= 1 && value <= 4 ? String(value) : '2';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const image = await imageService.getEditorImage(params.imageId);
    const [project, variants, presets, parentImage] = await Promise.all([
      projectService.getProject(image.projectId),
      imageService.listChildVariants(image.id),
      presetService.listPresets(),
      image.parentImageId ? imageService.getEditorImage(image.parentImageId) : Promise.resolve(null)
    ]);
    const promptSnapshot = (image.promptSnapshot as Record<string, unknown> | null) ?? null;
    const settingsSnapshot = (image.settingsSnapshot as Record<string, unknown> | null) ?? null;
    const initialMode = readMode(promptSnapshot?.mode);

    return {
      image,
      project,
      variants,
      parentImage,
      editorDefaults: {
        mode: initialMode,
        stylePreset: readString(settingsSnapshot?.stylePreset, 'original'),
        lightPreset: readString(settingsSnapshot?.lightPreset, 'original'),
        variantsRequested: readVariants(settingsSnapshot?.variantsRequested),
        instructions: readString(settingsSnapshot?.instructions),
        targetMaterial: readString(settingsSnapshot?.targetMaterial, 'oak-light'),
        surfaceDescription: readString(settingsSnapshot?.surfaceDescription)
      },
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
