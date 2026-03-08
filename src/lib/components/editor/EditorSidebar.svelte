<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import ModeTabs from '$lib/components/editor/ModeTabs.svelte';
  import type { PresetOption } from '$lib/types/preset';

  export let styleOptions: PresetOption[] = [];
  export let lightOptions: PresetOption[] = [];
  export let initialMode: 'environment_edit' | 'material_edit' = 'environment_edit';
  export let initialStyle = 'original';
  export let initialLight = 'original';
  export let initialVariants = '2';
  export let initialInstructions = '';
  export let initialTargetMaterial = 'oak-light';
  export let initialSurfaceDescription = '';
  export let submitting = false;
  export let error = '';

  const dispatch = createEventDispatcher<{
    generate: {
      mode: 'environment_edit' | 'material_edit';
      stylePreset: string;
      lightPreset: string;
      variantsRequested: number;
      instructions: string;
      targetMaterial: string | null;
      surfaceDescription: string;
      preserveObject: boolean;
      preservePerspective: boolean;
    };
    modechange: {
      mode: 'environment_edit' | 'material_edit';
    };
  }>();

  const materialOptions = [
    { value: 'oak-light', label: 'Eiche hell' },
    { value: 'walnut', label: 'Nussbaum' },
    { value: 'ash-natural', label: 'Esche natur' },
    { value: 'smoked-oak', label: 'Räuchereiche' },
    { value: 'black-stained', label: 'Schwarz gebeizt' }
  ];

  let mode = initialMode;
  let environmentStyle = initialStyle;
  let environmentLight = initialLight;
  let environmentVariants = initialVariants;
  let environmentNotes = initialMode === 'environment_edit' ? initialInstructions : '';
  let materialVariants = initialVariants;
  let materialNotes = initialMode === 'material_edit' ? initialInstructions : '';
  let targetMaterial = initialTargetMaterial;
  let surfaceDescription = initialSurfaceDescription;

  $: protectionRules =
    mode === 'material_edit'
      ? [
          'Form erhalten',
          'Konstruktion erhalten',
          'Perspektive erhalten',
          'Hintergrund erhalten',
          'Licht möglichst erhalten'
        ]
      : [
          'Objekt erhalten',
          'Perspektive erhalten',
          'Bildausschnitt möglichst erhalten',
          'Keine zusätzlichen Möbel',
          'Änderungen primär an der Umgebung'
        ];

  const submit = () => {
    if (mode === 'material_edit') {
      dispatch('generate', {
        mode,
        stylePreset: 'original',
        lightPreset: 'original',
        variantsRequested: Number(materialVariants),
        instructions: materialNotes.trim(),
        targetMaterial,
        surfaceDescription: surfaceDescription.trim(),
        preserveObject: true,
        preservePerspective: true
      });

      return;
    }

    dispatch('generate', {
      mode,
      stylePreset: environmentStyle,
      lightPreset: environmentLight,
      variantsRequested: Number(environmentVariants),
      instructions: environmentNotes.trim(),
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: true,
      preservePerspective: true
    });
  };
</script>

<div class="stack">
  <Card accent="blue">
    <div class="stack">
      <div>
        <div class="eyebrow">Mode</div>
        <h2>{mode === 'material_edit' ? 'Material Edit' : 'Environment Edit'}</h2>
      </div>
      <ModeTabs
        value={mode}
        on:change={(event) => {
          mode = event.detail;
          dispatch('modechange', { mode });
        }}
      />
    </div>
  </Card>

  <Card>
    <form class="stack" on:submit|preventDefault={submit}>
      {#if mode === 'material_edit'}
        <Select
          bind:value={targetMaterial}
          id="editor-material"
          label="Zielmaterial"
          description="Material darf sich ändern, Form und Aufbau sollen erhalten bleiben."
          options={materialOptions}
        />
        <Input
          bind:value={surfaceDescription}
          id="editor-surface"
          label="Oberfläche"
          description="Optional, z. B. matt geölt oder fein gebürstet."
          placeholder="z. B. matt geölt, offenporig, leicht gebürstet"
        />
        <Input
          bind:value={materialNotes}
          id="editor-material-notes"
          label="Zusätzliche Hinweise"
          multiline
          placeholder="z. B. Maserung ruhig halten, warme Holzwirkung ohne Farbkippen"
        />
        <Select
          bind:value={materialVariants}
          id="editor-material-variants"
          label="Varianten"
          options={[
            { value: '1', label: '1 Variante' },
            { value: '2', label: '2 Varianten' },
            { value: '3', label: '3 Varianten' },
            { value: '4', label: '4 Varianten' }
          ]}
        />
      {:else}
        <Select
          bind:value={environmentStyle}
          id="editor-style"
          label="Stil"
          description="Deterministische Stil-Presets für die Umgebungsanpassung."
          options={styleOptions}
        />
        <Select
          bind:value={environmentLight}
          id="editor-light"
          label="Licht"
          description="Licht wirkt auf die Umgebung, nicht auf das Möbel als neues Objekt."
          options={lightOptions}
        />
        <Select
          bind:value={environmentVariants}
          id="editor-variants"
          label="Varianten"
          options={[
            { value: '1', label: '1 Variante' },
            { value: '2', label: '2 Varianten' },
            { value: '3', label: '3 Varianten' },
            { value: '4', label: '4 Varianten' }
          ]}
        />
        <Input
          bind:value={environmentNotes}
          id="editor-notes"
          label="Zusätzliche Hinweise"
          multiline
          placeholder="z. B. gelbe Wand, Hängepflanzen, ruhigere Atmosphäre"
        />
      {/if}
      <div class="editor-sidebar__rules">
        <Card accent="yellow">
          <div class="stack">
            <div>
              <div class="eyebrow">Standardschutzregeln</div>
              <p class="muted">Diese Regeln sind sichtbar und im Flow standardmäßig aktiv.</p>
            </div>
            <div class="editor-sidebar__rule-list">
              {#each protectionRules as rule}
                <span>{rule}</span>
              {/each}
            </div>
          </div>
        </Card>
      </div>
      <div class="editor-sidebar__info">
        <Card>
          <div class="stack">
            <div class="eyebrow">Dev Flow</div>
            <p class="muted">
              Die Generierung läuft lokal als fake-{mode}-Variante, ohne Vertex-AI.
            </p>
          </div>
        </Card>
      </div>
      {#if error}
        <p class="editor-sidebar__error">{error}</p>
      {/if}
      <Button type="submit" variant="primary" loading={submitting}>Varianten generieren</Button>
    </form>
  </Card>
</div>

<style>
  h2 {
    margin: 6px 0 0;
  }

  .editor-sidebar__rules,
  .editor-sidebar__info {
    background: var(--color-surface-muted);
  }

  .editor-sidebar__rule-list {
    display: grid;
    gap: 8px;
  }

  .editor-sidebar__rule-list span {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    display: inline-flex;
    padding: 8px 12px;
    width: fit-content;
  }

  .editor-sidebar__error {
    color: var(--color-red);
    margin: 0;
  }
</style>
