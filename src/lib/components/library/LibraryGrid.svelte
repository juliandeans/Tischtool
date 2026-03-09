<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ImageCard from '$lib/components/library/ImageCard.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';

  const dispatch = createEventDispatcher<{
    delete: { id: string };
  }>();

  type ImageItem = {
    id: string;
    title: string;
    project: string;
    imageId?: string;
    time: string;
    status: string;
    thumbnailUrl: string;
    downloadUrl: string;
    editUrl: string;
    width?: number | null;
    height?: number | null;
  };

  export let items: ImageItem[] = [];
  export let loading = false;
  export let deletingId = '';
</script>

{#if loading}
  <div class="loading">
    <Spinner />
    <span class="muted">Bilder werden geladen…</span>
  </div>
{:else if items.length === 0}
  <EmptyState
    title="Noch keine Bilder"
    description="Lade ein erstes Bild hoch, damit die Library Thumbnail, Download und Edit zeigen kann."
  />
{:else}
  <div class="grid">
    {#each items as item}
      <ImageCard
        {...item}
        deleting={deletingId === item.id}
        on:delete={() => dispatch('delete', { id: item.id })}
      />
    {/each}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .loading {
    align-items: center;
    display: flex;
    gap: var(--space-2);
  }
</style>
