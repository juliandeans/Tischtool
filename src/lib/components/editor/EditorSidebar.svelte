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
  export let initialStyle = 'original';
  export let initialLight = 'original';
  export let initialVariants = '2';
  export let initialInstructions = '';
  export let submitting = false;
  export let error = '';

  const dispatch = createEventDispatcher<{
    generate: {
      stylePreset: string;
      lightPreset: string;
      variantsRequested: number;
      instructions: string;
      preserveObject: boolean;
      preservePerspective: boolean;
    };
  }>();

  let style = initialStyle;
  let light = initialLight;
  let variants = initialVariants;
  let notes = initialInstructions;

  const protectionRules = [
    'Objekt erhalten',
    'Perspektive erhalten',
    'Bildausschnitt möglichst erhalten',
    'Keine zusätzlichen Möbel',
    'Änderungen primär an der Umgebung'
  ];

  const submit = () => {
    dispatch('generate', {
      stylePreset: style,
      lightPreset: light,
      variantsRequested: Number(variants),
      instructions: notes.trim(),
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
        <h2>Environment Edit</h2>
      </div>
      <ModeTabs value="environment_edit" />
    </div>
  </Card>

  <Card>
    <form class="stack" on:submit|preventDefault={submit}>
      <Select
        bind:value={style}
        id="editor-style"
        label="Stil"
        description="Deterministische Stil-Presets für die Umgebungsanpassung."
        options={styleOptions}
      />
      <Select
        bind:value={light}
        id="editor-light"
        label="Licht"
        description="Licht wirkt auf die Umgebung, nicht auf das Möbel als neues Objekt."
        options={lightOptions}
      />
      <Select
        bind:value={variants}
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
        bind:value={notes}
        id="editor-notes"
        label="Zusätzliche Hinweise"
        multiline
        placeholder="z. B. gelbe Wand, Hängepflanzen, ruhigere Atmosphäre"
      />
      <div class="editor-sidebar__rules">
        <Card accent="yellow">
          <div class="stack">
            <div>
              <div class="eyebrow">Standardschutzregeln</div>
              <p class="muted">
                Diese Regeln sind in Phase 4 sichtbar und im Flow standardmäßig aktiv.
              </p>
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
              Die Generierung läuft lokal als fake environment_edit-Variante, ohne Vertex-AI.
            </p>
          </div>
        </Card>
      </div>
      {#if error}
        <p class="editor-sidebar__error">{error}</p>
      {/if}
      <Button variant="primary" loading={submitting}>Varianten generieren</Button>
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
