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
    expect(result.promptText).toContain(
      '- Diese visuellen Änderungen sind das primäre Änderungsziel.'
    );
    expect(result.promptText).toContain('- gelbe Wand');
    expect(result.promptText).toContain('- Hängepflanzen');
    expect(result.promptText).toContain('- ruhiger');
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Änderungsbereich:')
    );
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Stil:')
    );
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Licht:')
    );
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Ausgabeziel:')
    );
    expect(result.promptDebug.instructionDebug).toEqual({
      rawInput: 'gelbe Wand, Hängepflanzen, ruhiger',
      normalizedLines: ['gelbe Wand', 'Hängepflanzen', 'ruhiger']
    });
    expect(result.promptDebug.providerDebug.request.requestType).toBe('edit');
    expect(result.promptDebug.providerDebug.request.sourceImageIncluded).toBe(true);
    expect(result.promptDebug.providerDebug.request.maskIncluded).toBe(true);
    expect(result.promptDebug.providerDebug.run).toBeNull();
  });

  it('parses line breaks as individual hints', () => {
    const result = promptBuilder.build({
      projectId: 'project-2',
      sourceImageId: 'image-2',
      mode: 'environment_edit',
      variantsRequested: 1,
      stylePreset: 'original',
      lightPreset: 'original',
      instructions: 'Fischteich\nrote Wand\nPalme im Garten',
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: null
    });

    expect(result.promptDebug.instructionDebug.rawInput).toBe(
      'Fischteich\nrote Wand\nPalme im Garten'
    );
    expect(result.promptDebug.instructionDebug.normalizedLines).toEqual([
      'Fischteich',
      'rote Wand',
      'Palme im Garten'
    ]);
    expect(result.promptText).toContain('Entscheidende zusätzliche Hinweise:');
    expect(result.promptText).toContain('- Fischteich');
    expect(result.promptText).toContain('- rote Wand');
    expect(result.promptText).toContain('- Palme im Garten');
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Änderungsbereich:')
    );
  });

  it('parses mixed separators identically', () => {
    const result = promptBuilder.build({
      projectId: 'project-3',
      sourceImageId: 'furniture-1',
      mode: 'room_insert',
      variantsRequested: 1,
      stylePreset: 'editorial',
      lightPreset: 'tageslicht',
      instructions: 'rotes Haus,\nFischteich ;\nPalme im Garten',
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
      'rotes Haus,\nFischteich ;\nPalme im Garten'
    );
    expect(result.promptDebug.instructionDebug.normalizedLines).toEqual([
      'rotes Haus',
      'Fischteich',
      'Palme im Garten'
    ]);
    expect(result.promptText).toContain('Raumfoto-ID: room-1.');
    expect(result.promptText).toContain('- rotes Haus');
    expect(result.promptText).toContain('- Fischteich');
    expect(result.promptText).toContain('- Palme im Garten');
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Änderungsbereich:')
    );
  });

  it('keeps a single hint as a single normalized line', () => {
    const result = promptBuilder.build({
      projectId: 'project-4',
      sourceImageId: 'image-4',
      mode: 'material_edit',
      variantsRequested: 1,
      stylePreset: 'original',
      lightPreset: 'original',
      instructions: 'rotes Haus',
      targetMaterial: 'oak-light',
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: null
    });

    expect(result.promptDebug.instructionDebug.rawInput).toBe('rotes Haus');
    expect(result.promptDebug.instructionDebug.normalizedLines).toEqual(['rotes Haus']);
    expect(result.promptText).toContain('Entscheidende zusätzliche Hinweise:');
    expect(result.promptText).toContain('- rotes Haus');
    expect(result.promptText.indexOf('Entscheidende zusätzliche Hinweise:')).toBeLessThan(
      result.promptText.indexOf('Änderungsbereich:')
    );
  });
});
