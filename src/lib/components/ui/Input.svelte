<script lang="ts">
  export let id = '';
  export let label = '';
  export let description = '';
  export let error = '';
  export let value = '';
  export let type = 'text';
  export let placeholder = '';

  $: describedBy = [description ? `${id}-description` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');
</script>

<label class="field">
  {#if label}
    <span class="field__label">{label}</span>
  {/if}
  {#if description}
    <span class="field__description" id={`${id}-description`}>{description}</span>
  {/if}
  <input
    {...$$restProps}
    bind:value
    aria-describedby={describedBy || undefined}
    aria-invalid={error ? 'true' : 'false'}
    class:error={Boolean(error)}
    {id}
    {placeholder}
    {type}
  />
  {#if error}
    <span class="field__error" id={`${id}-error`}>{error}</span>
  {/if}
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

  input {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-input);
    box-shadow: var(--color-shadow-inset);
    min-height: 44px;
    outline: none;
    padding: 0 14px;
  }

  input:focus {
    border-color: var(--color-blue);
  }

  input.error {
    border-color: var(--color-red);
  }

  .field__error {
    color: var(--color-red);
    font-size: 0.9rem;
  }
</style>
