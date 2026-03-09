<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import ModeTabs from '$lib/components/editor/ModeTabs.svelte';
  import {
    DEFAULT_PROTECTION_RULES,
    type GenerationMode,
    type ProtectionRules,
    type RoomPreset
  } from '$lib/types/generation';

  export let initialMode: GenerationMode = 'environment_edit';
  export let initialStyle = 'original';
  export let initialLight = 'original';
  export let initialVariants = '1';
  export let initialInstructions = '';
  export let initialRoomPreset: RoomPreset = 'none';
  export let submitting = false;
  export let error = '';

  const dispatch = createEventDispatcher<{
    generate: {
      mode: GenerationMode;
      stylePreset: string;
      lightPreset: string;
      roomPreset: RoomPreset;
      variantsRequested: number;
      userInput: string;
      instructions: string;
      targetMaterial: null;
      surfaceDescription: string;
      preserveObject: boolean;
      preservePerspective: boolean;
      protectionRules: ProtectionRules;
    };
    modechange: {
      mode: GenerationMode;
    };
    statechange: {
      mode: GenerationMode;
      stylePreset: string;
      lightPreset: string;
      roomPreset: RoomPreset;
      variantsRequested: number;
      userInput: string;
      instructions: string;
      targetMaterial: null;
      surfaceDescription: string;
      preserveObject: boolean;
      preservePerspective: boolean;
      protectionRules: ProtectionRules;
    };
  }>();

  const styleOptions = [
    { value: 'original', label: 'Original' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'warm', label: 'Warm' },
    { value: 'modern', label: 'Modern' }
  ];

  const lightOptions = [
    { value: 'original', label: 'Original' },
    { value: 'warm', label: 'Warm' },
    { value: 'bright', label: 'Hell' },
    { value: 'dramatic', label: 'Dramatisch' }
  ];

  const roomContextOptions = [
    { value: 'none', label: 'Aktuell belassen' },
    { value: 'modern_living', label: 'Modernes Wohnzimmer' },
    { value: 'scandinavian', label: 'Skandinavisch' },
    { value: 'landhaus', label: 'Landhaus' },
    { value: 'loft', label: 'Loft / Industrial' },
    { value: 'office', label: 'Büro / Arbeitszimmer' },
    { value: 'childrens_room', label: 'Kinderzimmer' }
  ];

  let mode = initialMode;
  let stylePreset = initialStyle;
  let lightPreset = initialLight;
  let roomPreset = initialRoomPreset;
  let variantsRequested = initialVariants;
  let userInput = initialInstructions;
  let showProtectionRules = false;
  let protectionRules: ProtectionRules = { ...DEFAULT_PROTECTION_RULES };

  $: if (mode === 'material_edit') {
    protectionRules = {
      ...protectionRules,
      changesOnlyEnvironment: false
    };
  }

  const buildPayload = () => ({
    mode,
    stylePreset,
    lightPreset: mode === 'material_edit' ? 'original' : lightPreset,
    roomPreset,
    variantsRequested: Number(variantsRequested),
    userInput: userInput.trim(),
    instructions: userInput.trim(),
    targetMaterial: null,
    surfaceDescription: '',
    preserveObject: protectionRules.preserveObject,
    preservePerspective: protectionRules.preservePerspective,
    protectionRules
  });

  const ruleItems: Array<{ key: keyof ProtectionRules; label: string }> =
    mode === 'material_edit'
      ? [
          { key: 'preserveObject', label: 'Objekt erhalten' },
          { key: 'preservePerspective', label: 'Perspektive erhalten' },
          { key: 'preserveCrop', label: 'Bildausschnitt möglichst erhalten' },
          { key: 'noExtraFurniture', label: 'Keine zusätzlichen Möbel' }
        ]
      : [
          { key: 'preserveObject', label: 'Objekt erhalten' },
          { key: 'preservePerspective', label: 'Perspektive erhalten' },
          { key: 'preserveCrop', label: 'Bildausschnitt möglichst erhalten' },
          { key: 'noExtraFurniture', label: 'Keine zusätzlichen Möbel' },
          { key: 'changesOnlyEnvironment', label: 'Änderungen primär an der Umgebung' }
        ];

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
        <h2>
          {mode === 'material_edit'
            ? 'Stück modellieren'
            : mode === 'room_placement'
              ? 'Stück platzieren'
              : 'Umgebung'}
        </h2>
      </div>
      <ModeTabs
        value={mode}
        on:change={(event) => {
          mode = event.detail;
          if (mode === 'material_edit' && roomPreset === 'none') {
            roomPreset = 'none';
          }
          dispatch('modechange', { mode });
        }}
      />
    </div>
  </Card>

  <Card>
    <form class="stack" on:submit|preventDefault={submit}>
      <Select
        bind:value={roomPreset}
        id="editor-room-context"
        label="Raumkontext"
        description="Optionaler Zielraum für die Bildanpassung."
        options={roomContextOptions}
      />

      <Select bind:value={stylePreset} id="editor-style" label="Stil" options={styleOptions} />

      {#if mode !== 'material_edit'}
        <Select bind:value={lightPreset} id="editor-light" label="Licht" options={lightOptions} />
      {/if}

      <Select
        bind:value={variantsRequested}
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
        bind:value={userInput}
        id="editor-user-input"
        label={mode === 'material_edit' ? 'Änderungen am Möbelstück' : 'Zusätzliche Hinweise'}
        multiline
        placeholder={
          mode === 'material_edit'
            ? 'z. B. weichere Formensprache, reduziertere Oberfläche, moderner wirken'
            : 'z. B. gelbe Wand, Teppich austauschen, ruhigeres Gesamtbild'
        }
      />

      {#if mode !== 'room_placement'}
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
                  {#each ruleItems as rule, index}
                    <label class="editor-sidebar__rule">
                      <input
                        checked={protectionRules[rule.key]}
                        class="editor-sidebar__checkbox"
                        type="checkbox"
                        on:change={(event) => {
                          const target = event.currentTarget as HTMLInputElement;
                          protectionRules = {
                            ...protectionRules,
                            [rule.key]: target.checked
                          };
                        }}
                      />
                      <span>{rule.label}</span>
                    </label>
                    {#if index < ruleItems.length - 1}
                      <div class="editor-sidebar__rule-divider" aria-hidden="true"></div>
                    {/if}
                  {/each}
                </div>
              </div>
            </details>
          </Card>
        </div>
      {/if}

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

  .editor-sidebar__disclosure {
    display: grid;
  }

  .editor-sidebar__summary {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    list-style: none;
    padding: 16px var(--space-4);
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
  }

  .editor-sidebar__summary-indicator {
    border-bottom: 4px solid transparent;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid var(--color-text);
    height: 0;
    transition: transform 160ms ease;
    width: 0;
  }

  details[open] .editor-sidebar__summary-indicator {
    transform: rotate(180deg);
  }

  .editor-sidebar__rules-panel {
    padding: 0 var(--space-4) var(--space-4);
  }

  .editor-sidebar__rule-list {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    display: grid;
    overflow: hidden;
  }

  .editor-sidebar__rule {
    align-items: center;
    display: grid;
    gap: 12px;
    grid-template-columns: auto 1fr;
    padding: 14px 16px;
  }

  .editor-sidebar__rule-divider {
    background: linear-gradient(
      90deg,
      rgba(208, 203, 194, 0),
      rgba(208, 203, 194, 1),
      rgba(208, 203, 194, 0)
    );
    height: 1px;
    margin: 0 16px;
  }

  .editor-sidebar__checkbox {
    appearance: none;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(0, 0, 0, 0.04);
    display: grid;
    height: 28px;
    margin: 0;
    place-items: center;
    width: 28px;
  }

  .editor-sidebar__checkbox::after {
    border-bottom: 3px solid var(--color-blue);
    border-right: 3px solid var(--color-blue);
    content: '';
    height: 11px;
    opacity: 0;
    transform: translateY(-1px) rotate(45deg);
    width: 6px;
  }

  .editor-sidebar__checkbox:checked::after {
    opacity: 1;
  }

  .editor-sidebar__checkbox:focus-visible {
    outline: 2px solid rgba(0, 87, 184, 0.24);
    outline-offset: 2px;
  }

  .editor-sidebar__error {
    color: var(--color-red);
    margin: 0;
  }
</style>
