import { describe, expect, it } from 'vitest';

import { promptBuilder } from '$lib/server/prompt-builder';

describe('promptBuilder', () => {
  it('applies environment protection rules and preset fragments deterministically', () => {
    const result = promptBuilder.build({
      projectId: 'project-1',
      sourceImageId: 'image-1',
      mode: 'environment_edit',
      variantsRequested: 2,
      stylePreset: 'wohnlich',
      lightPreset: 'abendlicht',
      instructions: 'Gelbe Wand und wenige Pflanzen',
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: false,
      placement: null,
      protectionRules: {
        preserveObject: true,
        preservePerspective: false,
        preserveFrame: false,
        noExtraFurniture: false,
        changeEnvironmentFirst: true
      }
    });

    expect(result.promptText).toContain(
      'Erhalte das Möbelobjekt in Form, Konstruktion und Materialanmutung.'
    );
    expect(result.promptText).toContain('Weitere Möbel sind nur erlaubt');
    expect(result.promptText).toContain('Gestalte die Umgebung warm, wohnlich und einladend.');
    expect(result.promptText).toContain('Nutze warmes, weiches Abendlicht.');
    expect(result.promptText).toContain(
      'Perspektive und Bildausschnitt dürfen vorsichtig angepasst werden.'
    );
    expect(
      result.promptDebug.protectionRules.find((rule) => rule.key === 'noExtraFurniture')
    ).toMatchObject({
      enabled: false
    });
  });

  it('includes room insert placement and request modeling in the debug output', () => {
    const result = promptBuilder.build({
      projectId: 'project-2',
      sourceImageId: 'furniture-1',
      mode: 'room_insert',
      variantsRequested: 1,
      stylePreset: 'editorial',
      lightPreset: 'tageslicht',
      instructions: 'Möbel eher zurückhaltend wirken lassen',
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: {
        roomImageId: 'room-1',
        x: 120,
        y: 240,
        width: 260,
        height: 180
      }
    });

    expect(result.promptText).toContain('roomImageId=room-1');
    expect(result.promptDebug.requestPreview.placement).toEqual({
      roomImageId: 'room-1',
      x: 120,
      y: 240,
      width: 260,
      height: 180
    });
    expect(result.promptDebug.modeParameters).toContainEqual({
      label: 'Raumfoto-ID',
      value: 'room-1'
    });
  });
});
