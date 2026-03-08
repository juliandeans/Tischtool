<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';
  export let size: 'sm' | 'md' = 'md';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let loading = false;

  $: classes = ['button', `button--${variant}`, `button--${size}`, $$props.class]
    .filter(Boolean)
    .join(' ');
</script>

<button {...$$restProps} {type} class={classes} disabled={disabled || loading}>
  {#if loading}
    <span class="button__spinner" aria-hidden="true"></span>
    <span>Lädt...</span>
  {:else}
    <slot />
  {/if}
</button>

<style>
  .button {
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: var(--color-shadow-inset);
    cursor: pointer;
    display: inline-flex;
    gap: 10px;
    justify-content: center;
    font-weight: 600;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .button:hover:enabled {
    transform: translateY(-1px);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .button--sm {
    min-height: 38px;
    padding: 0 14px;
  }

  .button--md {
    min-height: 44px;
    padding: 0 18px;
  }

  .button--primary {
    background: var(--color-blue);
    border-color: var(--color-blue);
    color: #fff;
  }

  .button--secondary {
    background: var(--color-surface);
    color: var(--color-text);
  }

  .button--danger {
    background: var(--color-red);
    border-color: var(--color-red);
    color: #fff;
  }

  .button__spinner {
    animation: spin 1s linear infinite;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 999px;
    height: 14px;
    width: 14px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
