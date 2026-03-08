<script lang="ts">
  export let title = '';
  export let description = '';
  export let accent: 'blue' | 'yellow' | 'red' = 'yellow';
</script>

<div class={`empty-state empty-state--${accent}`}>
  <div class="empty-state__mark" aria-hidden="true"></div>
  <div class="stack">
    <h2>{title}</h2>
    <p>{description}</p>
    <div class="cluster">
      <slot name="actions" />
    </div>
  </div>
</div>

<style>
  .empty-state {
    align-items: start;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-card);
    display: grid;
    gap: var(--space-3);
    grid-template-columns: auto 1fr;
    padding: var(--space-4);
  }

  .empty-state__mark {
    border-radius: 999px;
    height: 14px;
    margin-top: 8px;
    width: 14px;
  }

  .empty-state--blue .empty-state__mark {
    background: var(--color-blue);
  }

  .empty-state--yellow .empty-state__mark {
    background: var(--color-yellow);
  }

  .empty-state--red .empty-state__mark {
    background: var(--color-red);
  }

  h2,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
    max-width: 56ch;
  }

  @media (max-width: 720px) {
    .empty-state {
      grid-template-columns: 1fr;
    }
  }
</style>
