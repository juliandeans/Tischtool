<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ProjectGrid from '$lib/components/projects/ProjectGrid.svelte';

  export let data;

  let name = '';
  let description = '';
  let createError = '';
  let isCreating = false;

  const createProject = async (event: SubmitEvent) => {
    event.preventDefault();
    createError = '';

    if (!name.trim()) {
      createError = 'Bitte einen Projektnamen eingeben.';
      return;
    }

    isCreating = true;

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: description || null
      })
    });

    isCreating = false;

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      createError = payload.error || 'Projekt konnte nicht angelegt werden.';
      return;
    }

    name = '';
    description = '';
    await invalidateAll();
  };
</script>

<div class="page-header">
  <span class="eyebrow">Projects</span>
  <h1>Projektübersicht</h1>
  <p>Projekte werden jetzt aus der Datenbank geladen und bilden die Basis für den Upload-Flow.</p>
</div>

<div class="stack">
  <Card accent="blue">
    <form class="project-form" on:submit={createProject}>
      <Input bind:value={name} id="project-name" label="Projektname" />
      <Input bind:value={description} id="project-description" label="Beschreibung" />
      {#if createError}
        <p class="project-form__error">{createError}</p>
      {/if}
      <div class="cluster">
        <Button loading={isCreating} variant="primary">Projekt anlegen</Button>
      </div>
    </form>
  </Card>

  <ProjectGrid
    items={data.projects.map((project) => ({
      title: project.name,
      meta: project.description ?? 'Kein Beschreibungstext',
      href: `/projects/${project.id}`,
      imageCount: project.imageCount,
      coverThumbnailUrl: project.coverThumbnailUrl
    }))}
    loading={Boolean($navigating)}
  />
</div>

<style>
  .project-form {
    display: grid;
    gap: var(--space-3);
  }

  .project-form__error {
    color: var(--color-red);
    margin: 0;
  }
</style>
