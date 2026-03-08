<script lang="ts">
  export let id = '';
  export let label = '';
  export let description = '';
  export let value = '';
  export let options: { value: string; label: string }[] = [];
</script>

<label class="field">
  {#if label}
    <span class="field__label">{label}</span>
  {/if}
  {#if description}
    <span class="field__description">{description}</span>
  {/if}
  <div class="select-wrap">
    <select {...$$restProps} bind:value {id}>
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
</label>

<style>
  .field {
    display: grid;
    gap: 8px;
  }

  .field__label {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .field__description {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .select-wrap {
    position: relative;
  }

  .select-wrap::after {
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid var(--color-text-muted);
    content: '';
    pointer-events: none;
    position: absolute;
    right: 16px;
    top: calc(50% - 3px);
  }

  select {
    appearance: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-input);
    box-shadow: var(--color-shadow-inset);
    min-height: 44px;
    outline: none;
    padding: 0 42px 0 14px;
    width: 100%;
  }

  select:focus {
    border-color: var(--color-blue);
  }
</style>
