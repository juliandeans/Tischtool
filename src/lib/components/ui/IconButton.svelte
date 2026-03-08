<script lang="ts">
  export let label = '';
  export let variant: 'neutral' | 'primary' = 'neutral';
  export let disabled = false;
  export let href: string | null = null;
  export let download: string | boolean | null = null;
  export let target: '_self' | '_blank' | '_parent' | '_top' | null = null;
  export let rel: string | null = null;

  $: classes = ['icon-button', `icon-button--${variant}`, $$props.class].filter(Boolean).join(' ');
</script>

{#if href}
  <a
    {...$$restProps}
    class={classes}
    aria-label={label}
    title={label}
    {download}
    {href}
    {rel}
    {target}
  >
    <slot />
  </a>
{:else}
  <button
    {...$$restProps}
    type="button"
    class={classes}
    aria-label={label}
    title={label}
    {disabled}
  >
    <slot />
  </button>
{/if}

<style>
  .icon-button {
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: var(--color-shadow-inset);
    cursor: pointer;
    display: inline-flex;
    height: 36px;
    justify-content: center;
    transition:
      transform 120ms ease,
      border-color 120ms ease;
    width: 36px;
  }

  .icon-button:hover:enabled {
    transform: translateY(-1px);
  }

  .icon-button--primary {
    background: var(--color-blue);
    border-color: var(--color-blue);
    color: #fff;
  }

  a.icon-button {
    text-decoration: none;
  }

  .icon-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
</style>
