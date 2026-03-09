import { describe, expect, it } from 'vitest';

import { promptBuilder } from '$lib/server/prompt-builder';
import { DEFAULT_PROTECTION_RULES } from '$lib/types/generation';

describe('promptBuilder', () => {
  it('builds environment prompts from preserve and change blocks', () => {
    const result = promptBuilder.build({
      projectId: 'project-1',
      sourceImageId: 'image-1',
      mode: 'environment_edit',
      variantsRequested: 2,
      userInput: 'Gelbe Wand\nHängepflanzen',
      stylePreset: 'warm',
      lightPreset: 'bright',
      roomPreset: 'scandinavian',
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: null,
      protectionRules: DEFAULT_PROTECTION_RULES
    });

    expect(result.promptText).toContain('Du bearbeitest ein Innenraum-Foto mit einem Möbelstück.');
    expect(result.promptText).toContain('Behalte unverändert:');
    expect(result.promptText).toContain('Das Möbelstück exakt – Struktur, Form, Material, Oberfläche.');
    expect(result.promptText).toContain('Ändere folgende Aspekte:');
    expect(result.promptText).toContain('Skandinavischer Wohnstil.');
    expect(result.promptText).toContain('Stil: Warm');
    expect(result.promptText).toContain('Licht: Hell');
    expect(result.promptText).toContain('Gelbe Wand');
    expect(result.promptText).toContain('Hängepflanzen');
    expect(result.promptText).toContain('Photorealistisches Interieur-Foto.');
    expect(result.promptDebug.instructionDebug.normalizedLines).toEqual(['Gelbe Wand', 'Hängepflanzen']);
  });

  it('builds material prompts with room preservation and object changes only', () => {
    const result = promptBuilder.build({
      projectId: 'project-2',
      sourceImageId: 'image-2',
      mode: 'material_edit',
      variantsRequested: 1,
      userInput: 'Dunklere Oberfläche\nFeinere Maserung',
      stylePreset: 'modern',
      lightPreset: 'original',
      roomPreset: 'none',
      targetMaterial: 'oak-light',
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: null,
      protectionRules: DEFAULT_PROTECTION_RULES
    });

    expect(result.promptText).toContain(
      'Die gesamte Raumsituation exakt – Wand, Boden, Dekoration, Licht, Perspektive und Bildausschnitt.'
    );
    expect(result.promptText).toContain('Ändere folgende Aspekte am Möbelstück:');
    expect(result.promptText).toContain('Dunklere Oberfläche');
    expect(result.promptText).toContain('Feinere Maserung');
    expect(result.promptText).toContain('Stil: Modern');
    expect(result.promptText).not.toContain('Licht:');
  });

  it('requires a room preset for room placement', () => {
    expect(() =>
      promptBuilder.build({
        projectId: 'project-3',
        sourceImageId: 'image-3',
        mode: 'room_placement',
        variantsRequested: 1,
        userInput: '',
        stylePreset: 'original',
        lightPreset: 'original',
        roomPreset: 'none',
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: true,
        preservePerspective: true,
        placement: {
          roomImageId: 'room-1',
          x: 10,
          y: 20,
          width: 200,
          height: 300
        },
        protectionRules: DEFAULT_PROTECTION_RULES
      })
    ).toThrow("Für 'Stück platzieren' muss ein Raum-Preset gewählt werden.");
  });

  it('builds room placement prompts with required room context', () => {
    const result = promptBuilder.build({
      projectId: 'project-4',
      sourceImageId: 'image-4',
      mode: 'room_placement',
      variantsRequested: 1,
      userInput: 'Zusätzliche Kissen',
      stylePreset: 'minimal',
      lightPreset: 'dramatic',
      roomPreset: 'loft',
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true,
      placement: {
        roomImageId: 'room-2',
        x: 50,
        y: 80,
        width: 180,
        height: 260
      },
      protectionRules: DEFAULT_PROTECTION_RULES
    });

    expect(result.promptText).toContain(
      'Du erhältst ein Bild eines Möbelstücks. Platziere dieses Möbelstück'
    );
    expect(result.promptText).toContain('Urbaner Loft-Stil.');
    expect(result.promptText).toContain('Stil: Minimal');
    expect(result.promptText).toContain('Licht: Dramatisch');
    expect(result.promptText).toContain('Zusätzliche Anforderungen:\nZusätzliche Kissen');
    expect(result.promptText).toContain(
      'Das Möbelstück soll natürlich im Raum wirken, mit realistischen'
    );
  });
});
