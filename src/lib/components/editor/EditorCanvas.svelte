<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import { toShortDate } from '$lib/utils/dates';

  export let imageId = '';
  export let title = '';
  export let imageUrl = '';
  export let projectName = '';
  export let type = 'upload';
  export let createdAt = '';
  export let width: number | null = null;
  export let height: number | null = null;
</script>

<div class="canvas-card">
  <Card padded={false}>
    <div class="canvas">
      <img class="canvas__image" src={imageUrl} alt={title} />
    </div>
    <div class="canvas__meta">
      <div class="canvas__header">
        <div>
          <div class="canvas__label">Aktuelles Bild</div>
          <strong>{title}</strong>
        </div>
        <span class={`canvas__badge canvas__badge--${type}`}>{type}</span>
      </div>
      <div class="canvas__details">
        <span>Projekt: {projectName}</span>
        <span>ID: {imageId}</span>
        {#if width && height}
          <span>{width} × {height}px</span>
        {/if}
        {#if createdAt}
          <span>{toShortDate(createdAt)}</span>
        {/if}
      </div>
    </div>
  </Card>
</div>

<style>
  .canvas-card {
    min-height: 520px;
    overflow: hidden;
  }

  .canvas {
    align-items: center;
    background:
      linear-gradient(135deg, rgba(0, 87, 184, 0.05), rgba(242, 197, 0, 0.12)),
      var(--color-surface-muted);
    display: grid;
    min-height: 520px;
    padding: var(--space-4);
    place-items: center;
  }

  .canvas__image {
    background: var(--color-surface);
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 18px;
    max-height: 520px;
    object-fit: contain;
    width: min(100%, 840px);
  }

  .canvas__meta {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4) var(--space-4);
  }

  .canvas__header {
    align-items: start;
    display: flex;
    gap: var(--space-2);
    justify-content: space-between;
  }

  .canvas__label {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: 6px;
  }

  .canvas__details {
    color: var(--color-text-muted);
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.9rem;
  }

  .canvas__badge {
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 8px 12px;
    text-transform: uppercase;
  }

  .canvas__badge--upload {
    background: rgba(242, 197, 0, 0.2);
  }

  .canvas__badge--generated {
    background: rgba(0, 87, 184, 0.12);
    color: var(--color-blue);
  }
</style>
