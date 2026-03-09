import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { readProviderDebugEnabled } from '$lib/server/provider-settings';
import { imageService } from '$lib/server/services/ImageService';
import { presetService } from '$lib/server/services/PresetService';
import { projectService } from '$lib/server/services/ProjectService';
import type { MaterialEditSubMode, RoomPreset } from '$lib/types/generation';

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

const readRoomPreset = (value: unknown): RoomPreset =>
  value === 'modern_living' ||
  value === 'scandinavian' ||
  value === 'landhaus' ||
  value === 'loft' ||
  value === 'office' ||
  value === 'childrens_room'
    ? value
    : 'none';

const readMaterialEditSubMode = (value: unknown): MaterialEditSubMode =>
  value === 'form' || value === 'style' ? value : 'surface';

const readVariants = (value: unknown) =>
  typeof value === 'number' && value >= 1 && value <= 4 ? String(value) : '1';

export const load: PageServerLoad = async ({ params, cookies }) => {
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
      debugEnabled: readProviderDebugEnabled(cookies),
      image,
      project,
      variants,
      parentImage,
      editorDefaults: {
        mode: initialMode,
        stylePreset: readString(settingsSnapshot?.stylePreset, 'original'),
        lightPreset: readString(settingsSnapshot?.lightPreset, 'original'),
        roomPreset: readRoomPreset(settingsSnapshot?.roomPreset),
        materialEditSubMode: readMaterialEditSubMode(
          settingsSnapshot?.materialEditSubMode ?? promptSnapshot?.materialEditSubMode
        ),
        variantsRequested: readVariants(settingsSnapshot?.variantsRequested),
        instructions: readString(settingsSnapshot?.userInput ?? settingsSnapshot?.instructions),
        targetMaterial: readString(settingsSnapshot?.targetMaterial, ''),
        surfaceDescription: readString(settingsSnapshot?.surfaceDescription, '')
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
