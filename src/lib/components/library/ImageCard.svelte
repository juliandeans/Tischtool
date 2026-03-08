<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';

  export let title = '';
  export let meta = '';
</script>

<div class="image-card">
  <Card padded={false}>
    <div class="image-card__preview" aria-hidden="true"></div>
    <div class="image-card__overlay">
      <IconButton label="Download" disabled>
        <span aria-hidden="true">↓</span>
      </IconButton>
      <IconButton label="Edit" variant="primary" disabled>
        <span aria-hidden="true">✎</span>
      </IconButton>
    </div>
    <div class="image-card__body">
      <h3>{title}</h3>
      <p>{meta}</p>
    </div>
  </Card>
</div>

<style>
  .image-card {
    overflow: hidden;
    position: relative;
  }

  .image-card__preview {
    aspect-ratio: 4 / 3;
    background:
      linear-gradient(135deg, rgba(0, 87, 184, 0.1), rgba(227, 58, 44, 0.12)),
      var(--color-surface-muted);
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

  .image-card__body {
    display: grid;
    gap: 8px;
    padding: var(--space-3);
  }

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
  }
</style>
