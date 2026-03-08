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

export const load: PageServerLoad = async ({ url }) => {
  const requestedProjectId = url.searchParams.get('projectId');
  const projects = await projectService.listProjects();
  const selectedProjectId =
    requestedProjectId && projects.some((project) => project.id === requestedProjectId)
      ? requestedProjectId
      : (projects[0]?.id ?? null);

  const [images, presets, roomInsertResults] = await Promise.all([
    selectedProjectId ? imageService.listLibraryImages(selectedProjectId) : Promise.resolve([]),
    presetService.listPresets(),
    selectedProjectId
      ? imageService.listGeneratedImagesByMode(selectedProjectId, 'room_insert')
      : Promise.resolve([])
  ]);

  return {
    projects,
    selectedProjectId,
    images,
    roomInsertResults,
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
};
