<script lang="ts">
  export let padded = true;
  export let accent: 'none' | 'blue' | 'yellow' | 'red' = 'none';

  $: classes = [
    'card',
    padded ? 'card--padded' : '',
    accent !== 'none' ? `card--${accent}` : '',
    $$props.class
  ]
    .filter(Boolean)
    .join(' ');
</script>

<section class={classes}>
  <slot />
</section>

<style>
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
  }

  .card--padded {
    padding: var(--space-4);
  }

  .card--blue {
    border-top: 4px solid var(--color-blue);
  }

  .card--yellow {
    border-top: 4px solid var(--color-yellow);
  }

  .card--red {
    border-top: 4px solid var(--color-red);
  }
</style>
