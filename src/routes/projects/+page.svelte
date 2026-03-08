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
  let createSuccess = '';
  let isCreating = false;
  let showCreateForm = data.projects.length === 0;

  const createProject = async (event: SubmitEvent) => {
    event.preventDefault();
    createError = '';
    createSuccess = '';

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

    const payload = (await response.json()) as { project?: { name?: string } };

    name = '';
    description = '';
    createSuccess = payload.project?.name
      ? `Projekt "${payload.project.name}" wurde angelegt.`
      : 'Projekt wurde angelegt.';
    showCreateForm = false;
    await invalidateAll();
  };
</script>

<div class="stack page-body--flush">
  <div class="page-actions">
    <Button
      type="button"
      variant="primary"
      on:click={() => {
        createError = '';
        createSuccess = '';
        showCreateForm = !showCreateForm;
      }}
    >
      {showCreateForm ? 'Formular schließen' : 'Neues Projekt'}
    </Button>
  </div>

  {#if showCreateForm}
    <Card accent="blue">
      <div class="create-panel">
        <div class="create-panel__header">
          <h2>Projekt anlegen</h2>
          <p>Name ist Pflicht, Beschreibung optional.</p>
        </div>

        <form class="project-form" on:submit={createProject}>
          <Input bind:value={name} id="project-name" label="Projektname" />
          <Input
            bind:value={description}
            id="project-description"
            label="Beschreibung"
            multiline={true}
            rows={4}
          />
          {#if createError}
            <p class="project-form__error">{createError}</p>
          {/if}
          <div class="cluster">
            <Button type="submit" loading={isCreating} variant="primary">Projekt anlegen</Button>
          </div>
        </form>
      </div>
    </Card>
  {/if}

  {#if createSuccess}
    <p class="project-form__success">{createSuccess}</p>
  {/if}

  <ProjectGrid
    items={data.projects.map((project) => ({
      title: project.name,
      meta: project.description ?? 'Kein Beschreibungstext',
      href: `/projects/${project.id}`,
      imageCount: project.imageCount,
      coverThumbnailUrl: project.coverThumbnailUrl
    }))}
    loading={Boolean($navigating)}
  >
    <Button
      slot="actions"
      type="button"
      variant="primary"
      on:click={() => {
        createError = '';
        createSuccess = '';
        showCreateForm = true;
      }}
    >
      Projekt anlegen
    </Button>
  </ProjectGrid>
</div>

<style>
  .page-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .create-panel {
    display: grid;
    gap: var(--space-3);
  }

  .create-panel__header {
    display: grid;
    gap: 6px;
  }

  .create-panel__header h2,
  .create-panel__header p {
    margin: 0;
  }

  .create-panel__header p {
    color: var(--color-text-muted);
  }

  .project-form {
    display: grid;
    gap: var(--space-3);
  }

  .project-form__error {
    color: var(--color-red);
    margin: 0;
  }

  .project-form__success {
    color: var(--color-green);
    font-weight: 600;
    margin: 0;
  }
</style>
