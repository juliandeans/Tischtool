<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { imageAlt } from '$lib/utils/image';
  import Card from '$lib/components/ui/Card.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';

  const dispatch = createEventDispatcher<{
    delete: { id: string };
  }>();

  export let id = '';
  export let title = '';
  export let project = '';
  export let time = '';
  export let status = '';
  export let thumbnailUrl = '';
  export let downloadUrl = '';
  export let editUrl = '';
  export let deleting = false;
</script>

<div class="image-card">
  <Card padded={false}>
    <img class="image-card__preview" src={thumbnailUrl} alt={imageAlt(title)} loading="lazy" />
    <div class="image-card__overlay image-card__overlay--left">
      <IconButton
        label="Löschen"
        variant="neutral"
        disabled={deleting}
        on:click={() => dispatch('delete', { id })}
      >
        <span aria-hidden="true">🗑</span>
      </IconButton>
    </div>
    <div class="image-card__overlay">
      <IconButton href={downloadUrl} label="Download" download variant="neutral">
        <span aria-hidden="true">↓</span>
      </IconButton>
      <IconButton href={editUrl} label="Edit" variant="primary">
        <span aria-hidden="true">✎</span>
      </IconButton>
    </div>
    <div class="image-card__body">
      <h3>{title}</h3>
      <p>{project}</p>
      <div class="image-card__meta">
        <span>{time}</span>
        {#if status}
          <span>{status}</span>
        {/if}
      </div>
    </div>
  </Card>
</div>

<style>
  .image-card {
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .image-card :global(section) {
    height: 100%;
  }

  .image-card__preview {
    aspect-ratio: 4 / 3;
    background: var(--color-surface-muted);
    object-fit: cover;
    width: 100%;
  }

  .image-card__overlay {
    display: flex;
    gap: 8px;
    opacity: 0;
    position: absolute;
    right: var(--space-3);
    top: var(--space-3);
    transition: opacity 120ms ease;
  }

  .image-card:hover .image-card__overlay {
    opacity: 1;
  }

  .image-card:focus-within .image-card__overlay {
    opacity: 1;
  }

  .image-card__overlay--left {
    left: var(--space-3);
    right: auto;
  }

  .image-card__body {
    display: grid;
    gap: 8px;
    min-height: 112px;
    padding: var(--space-3);
  }

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
  }

  .image-card__meta {
    color: var(--color-text-muted);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.85rem;
    gap: 10px;
  }
</style>
