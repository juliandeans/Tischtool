<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import ModeTabs from '$lib/components/editor/ModeTabs.svelte';
  import type { GenerationProtectionRules } from '$lib/types/generation';
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
    statechange: {
      mode: 'environment_edit' | 'material_edit';
      stylePreset: string;
      lightPreset: string;
      variantsRequested: number;
      instructions: string;
      targetMaterial: string | null;
      surfaceDescription: string;
      preserveObject: boolean;
      preservePerspective: boolean;
      protectionRules: GenerationProtectionRules;
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
  let showProtectionRules = false;
  let environmentRuleState = {
    preserveObject: true,
    preservePerspective: true,
    preserveFrame: true,
    noExtraFurniture: true,
    changeEnvironmentFirst: true
  };
  let materialRuleState = {
    preserveForm: true,
    preserveConstruction: true,
    preservePerspective: true,
    preserveBackground: true,
    preserveLight: true
  };

  $: protectionRules =
    mode === 'material_edit'
      ? [
          { key: 'preserveForm', label: 'Form erhalten', checked: materialRuleState.preserveForm },
          {
            key: 'preserveConstruction',
            label: 'Konstruktion erhalten',
            checked: materialRuleState.preserveConstruction
          },
          {
            key: 'preservePerspective',
            label: 'Perspektive erhalten',
            checked: materialRuleState.preservePerspective
          },
          {
            key: 'preserveBackground',
            label: 'Hintergrund erhalten',
            checked: materialRuleState.preserveBackground
          },
          {
            key: 'preserveLight',
            label: 'Licht möglichst erhalten',
            checked: materialRuleState.preserveLight
          }
        ]
      : [
          {
            key: 'preserveObject',
            label: 'Objekt erhalten',
            checked: environmentRuleState.preserveObject
          },
          {
            key: 'preservePerspective',
            label: 'Perspektive erhalten',
            checked: environmentRuleState.preservePerspective
          },
          {
            key: 'preserveFrame',
            label: 'Bildausschnitt möglichst erhalten',
            checked: environmentRuleState.preserveFrame
          },
          {
            key: 'noExtraFurniture',
            label: 'Keine zusätzlichen Möbel',
            checked: environmentRuleState.noExtraFurniture
          },
          {
            key: 'changeEnvironmentFirst',
            label: 'Änderungen primär an der Umgebung',
            checked: environmentRuleState.changeEnvironmentFirst
          }
        ];

  const buildPayload = () => {
    if (mode === 'material_edit') {
      return {
        mode,
        stylePreset: 'original',
        lightPreset: 'original',
        variantsRequested: Number(materialVariants),
        instructions: materialNotes.trim(),
        targetMaterial,
        surfaceDescription: surfaceDescription.trim(),
        preserveObject: materialRuleState.preserveForm && materialRuleState.preserveConstruction,
        preservePerspective: materialRuleState.preservePerspective,
        protectionRules: materialRuleState
      };
    }

    return {
      mode,
      stylePreset: environmentStyle,
      lightPreset: environmentLight,
      variantsRequested: Number(environmentVariants),
      instructions: environmentNotes.trim(),
      targetMaterial: null,
      surfaceDescription: '',
      preserveObject: environmentRuleState.preserveObject,
      preservePerspective: environmentRuleState.preservePerspective,
      protectionRules: environmentRuleState
    };
  };

  const submit = () => {
    dispatch('generate', buildPayload());
  };

  $: dispatch('statechange', buildPayload());
</script>

<div class="stack">
  <Card accent="blue">
    <div class="stack">
      <div>
        <div class="eyebrow">Modus</div>
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
        <Card accent="yellow" class="editor-sidebar__rules-card" padded={false}>
          <details bind:open={showProtectionRules} class="editor-sidebar__disclosure">
            <summary class="editor-sidebar__summary">
              <span>
                <strong>Standardschutzregeln</strong>
                <small>Standardmäßig aktiv, bei Bedarf anpassbar.</small>
              </span>
              <span class="editor-sidebar__summary-indicator" aria-hidden="true"></span>
            </summary>
            <div class="editor-sidebar__rules-panel">
              <div class="editor-sidebar__rule-list">
                {#each protectionRules as rule}
                  <label class="editor-sidebar__rule">
                    <input
                      checked={rule.checked}
                      class="editor-sidebar__checkbox"
                      type="checkbox"
                      on:change={(event) => {
                        const target = event.currentTarget as HTMLInputElement;

                        if (mode === 'material_edit') {
                          materialRuleState = {
                            ...materialRuleState,
                            [rule.key]: target.checked
                          };

                          return;
                        }

                        environmentRuleState = {
                          ...environmentRuleState,
                          [rule.key]: target.checked
                        };
                      }}
                    />
                    <span>{rule.label}</span>
                  </label>
                {/each}
              </div>
            </div>
          </details>
        </Card>
      </div>
      <div class="editor-sidebar__info">
        <Card>
          <div class="stack">
            <div class="eyebrow">Lokaler Modus</div>
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

  .editor-sidebar__disclosure {
    display: grid;
    gap: 0;
  }

  .editor-sidebar__summary {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    list-style: none;
    min-height: 0;
    padding: 18px var(--space-4);
  }

  .editor-sidebar__summary::-webkit-details-marker {
    display: none;
  }

  .editor-sidebar__summary span {
    display: grid;
    gap: 4px;
  }

  .editor-sidebar__summary small {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .editor-sidebar__summary-indicator {
    border-bottom: 2px solid var(--color-text);
    border-right: 2px solid var(--color-text);
    height: 10px;
    transform: rotate(45deg);
    transition: transform 120ms ease;
    width: 10px;
  }

  .editor-sidebar__disclosure[open] .editor-sidebar__summary-indicator {
    transform: rotate(225deg);
  }

  .editor-sidebar__rules-panel {
    padding: 0 var(--space-4) var(--space-4);
  }

  .editor-sidebar__rule-list {
    display: grid;
    gap: 0;
  }

  .editor-sidebar__rule {
    align-items: center;
    display: grid;
    gap: 10px;
    grid-template-columns: auto minmax(0, 1fr);
    padding: 14px 0;
    position: relative;
  }

  .editor-sidebar__rule + .editor-sidebar__rule::before {
    background: linear-gradient(
      90deg,
      rgba(217, 213, 205, 0) 0%,
      rgba(217, 213, 205, 0.95) 18%,
      rgba(217, 213, 205, 0.95) 82%,
      rgba(217, 213, 205, 0) 100%
    );
    content: '';
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  .editor-sidebar__rule input {
    appearance: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    display: grid;
    height: 20px;
    margin: 0;
    place-items: center;
    position: relative;
    width: 20px;
  }

  .editor-sidebar__rule input::after {
    border-bottom: 3px solid var(--color-blue);
    border-right: 3px solid var(--color-blue);
    content: '';
    height: 9px;
    margin: 0;
    opacity: 0;
    transform: translateY(-1px) rotate(45deg) scale(0.8);
    transition:
      opacity 120ms ease,
      transform 120ms ease;
    width: 5px;
  }

  .editor-sidebar__rule input:checked::after {
    opacity: 1;
    transform: translateY(-1px) rotate(45deg) scale(1);
  }

  .editor-sidebar__rule input:focus-visible {
    outline: 2px solid rgba(0, 87, 184, 0.2);
    outline-offset: 2px;
  }

  .editor-sidebar__rule span {
    line-height: 1.3;
  }

  .editor-sidebar__error {
    color: var(--color-red);
    margin: 0;
  }
</style>
