<script lang="ts">
  export let value: 'environment_edit' | 'material_edit' = 'environment_edit';
</script>

<div class="tabs" aria-label="Modus-Auswahl">
  <button class:active={value === 'environment_edit'} type="button">Environment</button>
  <button class:active={value === 'material_edit'} type="button" disabled>Material</button>
</div>

<style>
  .tabs {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
</style>
