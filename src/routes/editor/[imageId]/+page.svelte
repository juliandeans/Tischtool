<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EditorCanvas from '$lib/components/editor/EditorCanvas.svelte';
  import EditorSidebar from '$lib/components/editor/EditorSidebar.svelte';
  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import { toShortDate } from '$lib/utils/dates';

  export let data;

  let generationError = '';
  let generationSuccess = '';
  let isGenerating = false;
  let activeMode = data.editorDefaults.mode;

  const handleGenerate = async (event: CustomEvent) => {
    generationError = '';
    generationSuccess = '';
    isGenerating = true;

    const response = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        projectId: data.project.id,
        sourceImageId: data.image.id,
        mode: event.detail.mode,
        variantsRequested: event.detail.variantsRequested,
        stylePreset: event.detail.stylePreset,
        lightPreset: event.detail.lightPreset,
        instructions: event.detail.instructions,
        targetMaterial: event.detail.targetMaterial,
        surfaceDescription: event.detail.surfaceDescription,
        preserveObject: event.detail.preserveObject,
        preservePerspective: event.detail.preservePerspective,
        placement: null
      })
    });

    isGenerating = false;

    const payload = await response.json();

    if (!response.ok) {
      generationError = payload.error || 'Generierung fehlgeschlagen.';
      return;
    }

    generationSuccess = `${payload.images.length} ${
      event.detail.mode === 'material_edit' ? 'Material-' : ''
    }Variante(n) wurden als neue Bilder gespeichert.`;
    await invalidateAll();
  };
</script>

<div class="page-header">
  <span class="eyebrow">Editor</span>
  <h1>Einzelbild-Editor</h1>
  <p>
    Das aktuelle Bild wird als Ausgangspunkt für `environment_edit` und `material_edit` verwendet.
    Neue Varianten werden nicht destruktiv als Child-Bilder gespeichert.
  </p>
</div>

<div class="split-layout">
  <EditorCanvas
    imageId={data.image.id}
    title={data.image.title}
    imageUrl={data.image.imageUrl}
    projectName={data.image.projectName}
    type={data.image.type}
    createdAt={data.image.createdAt}
    width={data.image.width}
    height={data.image.height}
  />
  <EditorSidebar
    error={generationError}
    initialInstructions={data.editorDefaults.instructions}
    initialLight={data.editorDefaults.lightPreset}
    initialMode={data.editorDefaults.mode}
    initialStyle={data.editorDefaults.stylePreset}
    initialSurfaceDescription={data.editorDefaults.surfaceDescription}
    initialTargetMaterial={data.editorDefaults.targetMaterial}
    initialVariants={data.editorDefaults.variantsRequested}
    submitting={isGenerating}
    styleOptions={data.styleOptions}
    lightOptions={data.lightOptions}
    on:generate={handleGenerate}
    on:modechange={(event) => {
      activeMode = event.detail.mode;
    }}
  />
</div>

<div class="stack editor-page__extras">
  {#if generationSuccess}
    <Card accent="blue">
      <p class="editor-page__message editor-page__message--success">{generationSuccess}</p>
    </Card>
  {/if}

  <Card accent="yellow">
    <div class="stack">
      <div class="cluster">
        <span class="eyebrow">Versionierung</span>
        <span class="muted">Projekt: {data.project.name}</span>
        <span class="muted"
          >Modus: {activeMode === 'material_edit' ? 'Material Edit' : 'Environment Edit'}</span
        >
      </div>
      <div class="cluster">
        {#if data.parentImage}
          <Button href={data.parentImage.editUrl}>Parent öffnen</Button>
        {/if}
        <Button href={`/projects/${data.project.id}`}>Projekt öffnen</Button>
        <Button href={data.image.downloadUrl}>Original herunterladen</Button>
        <span class="muted">Aktuelles Bild: {toShortDate(data.image.createdAt)}</span>
      </div>
    </div>
  </Card>

  {#if data.image.promptSnapshot?.promptText}
    <Card>
      <div class="stack">
        <div class="eyebrow">Letzter Prompt</div>
        <pre class="editor-page__prompt">{data.image.promptSnapshot.promptText}</pre>
      </div>
    </Card>
  {/if}

  <section class="stack">
    <div class="page-header editor-page__variants-header">
      <span class="eyebrow">Varianten</span>
      <h2>Ergebnisse aus diesem Bild</h2>
      <p>
        Jede neue Variante bleibt als Child-Bild erhalten und kann direkt wieder im Editor geöffnet
        werden.
      </p>
    </div>
    <LibraryGrid
      items={data.variants.map((image) => ({
        id: image.id,
        title: image.title,
        project: image.projectName,
        time: image.createdAt,
        status: image.type,
        thumbnailUrl: image.thumbnailUrl,
        downloadUrl: image.downloadUrl,
        editUrl: image.editUrl
      }))}
      loading={Boolean($navigating)}
    />
  </section>
</div>

<style>
  .editor-page__extras {
    margin-top: var(--space-4);
  }

  .editor-page__message {
    margin: 0;
  }

  .editor-page__message--success {
    color: var(--color-blue);
    font-weight: 600;
  }

  .editor-page__prompt {
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    margin: 0;
    overflow-x: auto;
    padding: var(--space-3);
    white-space: pre-wrap;
  }

  .editor-page__variants-header {
    margin-bottom: 0;
  }

  .editor-page__variants-header h2 {
    margin: 0;
  }
</style>
