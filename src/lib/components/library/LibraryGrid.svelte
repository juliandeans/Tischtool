<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ImageCard from '$lib/components/library/ImageCard.svelte';

  type ImageItem = {
    title: string;
    meta: string;
  };

  export let items: ImageItem[] = [];
</script>

{#if items.length === 0}
  <EmptyState
    title="Noch keine Bilder"
    description="Das responsive Grid ist bereits vorbereitet. Upload, Thumbnail-Erzeugung und Hover-Aktionen werden erst in Phase 3 angebunden."
  >
    <Button slot="actions" variant="secondary" disabled>Upload kommt später</Button>
  </EmptyState>
{:else}
  <div class="grid">
    {#each items as item}
      <ImageCard {...item} />
    {/each}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
</style>
