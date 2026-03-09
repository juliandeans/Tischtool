<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { GenerationMode } from '$lib/types/generation';

  export let value: GenerationMode = 'environment_edit';

  const dispatch = createEventDispatcher<{
    change: GenerationMode;
  }>();

  const MODES: Array<{ value: GenerationMode; label: string }> = [
    { value: 'environment_edit', label: 'Umgebung' },
    { value: 'material_edit', label: 'Stück modellieren' },
    { value: 'room_placement', label: 'Stück platzieren' }
  ];
</script>

<div class="tabs" aria-label="Modus-Auswahl">
  {#each MODES as mode, index}
    <button
      class:tabs__button={true}
      class:tabs__button--red={index === 0}
      class:tabs__button--yellow={index === 1}
      class:tabs__button--blue={index === 2}
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
    gap: 8px;
    grid-template-columns: 1fr;
  }

  .tabs__button {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    box-shadow: var(--color-shadow-inset);
    min-height: 44px;
    padding: 10px 14px;
    text-align: left;
  }

  .tabs__button--red {
    border-color: rgba(227, 58, 44, 0.55);
  }

  .tabs__button--yellow {
    border-color: rgba(242, 197, 0, 0.75);
  }

  .tabs__button--blue {
    border-color: rgba(0, 87, 184, 0.55);
  }

  .tabs__button--red.active {
    background: rgba(227, 58, 44, 0.06);
    color: var(--color-red);
  }

  .tabs__button--yellow.active {
    background: rgba(242, 197, 0, 0.1);
    color: #8a6700;
  }

  .tabs__button--blue.active {
    background: rgba(0, 87, 184, 0.08);
    color: var(--color-blue);
  }
</style>
