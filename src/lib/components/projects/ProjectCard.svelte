<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';

  export let title = '';
  export let meta = '';
  export let href = '/projects';
  export let imageCount = 0;
  export let coverThumbnailUrl: string | null = null;
</script>

<a class="project-card" {href}>
  <Card padded={false}>
    {#if coverThumbnailUrl}
      <img class="project-card__cover-image" src={coverThumbnailUrl} alt="" />
    {:else}
      <div class="project-card__cover" aria-hidden="true"></div>
    {/if}
    <div class="project-card__body">
      <h3>{title}</h3>
      <p>{meta}</p>
      <span class="project-card__count">{imageCount} Bilder</span>
    </div>
  </Card>
</a>

<style>
  .project-card {
    display: block;
    height: 100%;
  }

  .project-card :global(section) {
    height: 100%;
  }

  .project-card:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: 2px;
  }

  .project-card__cover {
    background:
      linear-gradient(135deg, rgba(0, 87, 184, 0.14), rgba(242, 197, 0, 0.18)),
      var(--color-surface-muted);
    min-height: 148px;
  }

  .project-card__cover-image {
    aspect-ratio: 4 / 3;
    background: var(--color-surface-muted);
    display: block;
    object-fit: cover;
    width: 100%;
  }

  .project-card__body {
    display: grid;
    gap: 8px;
    min-height: 120px;
    padding: var(--space-3);
  }

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
  }

  .project-card__count {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>
