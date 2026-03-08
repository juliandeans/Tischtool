<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ProjectCard from '$lib/components/projects/ProjectCard.svelte';

  type Project = {
    title: string;
    meta: string;
    href: string;
  };

  export let items: Project[] = [];
</script>

{#if items.length === 0}
  <EmptyState
    title="Noch keine Projekte"
    description="Die Projektliste ist für Phase 1 vorbereitet. Upload, Versionierung und echte Projektdaten folgen erst in späteren Phasen."
    accent="blue"
  >
    <Button slot="actions" disabled>Projekt anlegen</Button>
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
</style>
