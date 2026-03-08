<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ProjectCard from '$lib/components/projects/ProjectCard.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';

  type Project = {
    title: string;
    meta: string;
    href: string;
    imageCount: number;
    coverThumbnailUrl: string | null;
  };

  export let items: Project[] = [];
  export let loading = false;
</script>

{#if loading}
  <div class="loading">
    <Spinner />
    <span class="muted">Projekte werden geladen…</span>
  </div>
{:else if items.length === 0}
  <EmptyState
    title="Noch keine Projekte"
    description="Lege zuerst ein Projekt an, damit Uploads sauber zugeordnet werden und in der Library erscheinen."
    accent="blue"
  >
    <svelte:fragment slot="actions">
      <slot name="actions">
        <Button disabled>Projekt anlegen</Button>
      </slot>
    </svelte:fragment>
  </EmptyState>
{:else}
  <div class="grid">
    {#each items as item}
      <ProjectCard {...item} />
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
