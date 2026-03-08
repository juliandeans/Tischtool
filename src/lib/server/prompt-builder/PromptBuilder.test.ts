import { describe, expect, it } from 'vitest';

import { promptBuilder } from '$lib/server/prompt-builder';

describe('promptBuilder', () => {
  it('keeps visual fragments as a prioritized hint list', () => {
    const result = promptBuilder.build({
      projectId: 'project-1',
      sourceImageId: 'image-1',
      mode: 'environment_edit',
      variantsRequested: 2,
      stylePreset: 'wohnlich',
      lightPreset: 'abendlicht',
      instructions: 'gelbe Wand, Hängepflanzen, ruhiger',
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: null,
      protectionRules: {
        preserveObject: true,
        preservePerspective: true,
        preserveFrame: true,
        noExtraFurniture: true,
        changeEnvironmentFirst: true
      }
    });

    expect(result.promptText).toContain('Kontext:');
    expect(result.promptText).toContain('Erhaltungsregeln:');
    expect(result.promptText).toContain('Entscheidende zusätzliche Hinweise:');
    expect(result.promptText).toContain('- gelbe Wand');
    expect(result.promptText).toContain('- Hängepflanzen');
    expect(result.promptText).not.toContain('- ruhiger');
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Ausgabeziel:')
    );
    expect(result.promptDebug.instructionDebug).toEqual({
      rawInput: 'gelbe Wand, Hängepflanzen, ruhiger',
      normalizedLines: ['gelbe Wand', 'Hängepflanzen']
    });
  });

  it('splits hints by commas and line breaks without rewriting them', () => {
    const result = promptBuilder.build({
      projectId: 'project-2',
      sourceImageId: 'furniture-1',
      mode: 'room_insert',
      variantsRequested: 1,
      stylePreset: 'editorial',
      lightPreset: 'tageslicht',
      instructions: ' rotes Haus,\n Fischteich ; grünes Dach ',
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

    expect(result.promptDebug.instructionDebug.rawInput).toBe(
      'rotes Haus, Fischteich ; grünes Dach'
    );
    expect(result.promptDebug.instructionDebug.normalizedLines).toEqual([
      'rotes Haus',
      'Fischteich',
      'grünes Dach'
    ]);
    expect(result.promptText).toContain('Raumfoto-ID: room-1.');
    expect(result.promptText).toContain('- rotes Haus');
    expect(result.promptText).toContain('- Fischteich');
    expect(result.promptText).toContain('- grünes Dach');
  });
});
