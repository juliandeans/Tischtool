<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { GenerationMode } from '$lib/types/generation';

  export let value: GenerationMode = 'environment_edit';

  const dispatch = createEventDispatcher<{
    change: GenerationMode;
  }>();

  const MODES: Array<{ value: GenerationMode; label: string }> = [
    { value: 'room_placement', label: 'Stück platzieren' },
    { value: 'environment_edit', label: 'Umgebung' },
    { value: 'material_edit', label: 'Stück modellieren' }
  ];
</script>

<div class="tabs" aria-label="Modus-Auswahl">
  {#each MODES as mode}
    <button
      class:active={value === mode.value}
      aria-pressed={value === mode.value}
      type="button"
      on:click={() => dispatch('change', mode.value)}
    >
      {mode.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  button {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: var(--color-shadow-inset);
    min-height: 42px;
    padding: 0 14px;
  }

  button.active {
    background: rgba(0, 87, 184, 0.08);
    border-color: var(--color-blue);
    color: var(--color-blue);
  }

  @media (max-width: 720px) {
    .tabs {
      grid-template-columns: 1fr;
    }
  }
</style>
