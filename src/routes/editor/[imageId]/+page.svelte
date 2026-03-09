<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EditorCanvas from '$lib/components/editor/EditorCanvas.svelte';
  import EditorSidebar from '$lib/components/editor/EditorSidebar.svelte';
  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import PromptDebugPanel from '$lib/components/ui/PromptDebugPanel.svelte';
  import type { PostGenerationPreviewResponse, PostGenerationResponse } from '$lib/types/api';
  import type {
    GenerationMode,
    MaterialEditSubMode,
    PromptDebugPreview
  } from '$lib/types/generation';
  import { toShortDate } from '$lib/utils/dates';

  export let data;

  let generationError = '';
  let generationSuccess = '';
  let isGenerating = false;
  let activeMode: GenerationMode = data.editorDefaults.mode;
  let promptPreview: PromptDebugPreview | null = null;
  let promptPreviewError = '';
  let promptPreviewLoading = false;
  let latestPromptDebug: PromptDebugPreview | null = null;
  let editorState: {
    mode: 'environment_edit' | 'material_edit' | 'room_placement';
    stylePreset: string;
    lightPreset: string;
    roomPreset: string;
    materialEditSubMode: MaterialEditSubMode;
    variantsRequested: number;
    userInput: string;
    instructions: string;
    targetMaterial: null;
    surfaceDescription: string;
    preserveObject: boolean;
    preservePerspective: boolean;
    protectionRules: Record<string, boolean>;
  } | null = null;
  let promptPreviewTimer: ReturnType<typeof setTimeout> | null = null;
  let promptPreviewRequestId = 0;

  const loadPromptPreview = async () => {
    if (!browser || !data.debugEnabled || !editorState) {
      return;
    }

    const requestId = ++promptPreviewRequestId;
    promptPreviewLoading = true;
    promptPreviewError = '';

    const response = await fetch('/api/generations/preview', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        projectId: data.project.id,
        sourceImageId: data.image.id,
        mode: editorState.mode,
        variantsRequested: editorState.variantsRequested,
        stylePreset: editorState.stylePreset,
        lightPreset: editorState.lightPreset,
        roomPreset: editorState.roomPreset,
        materialEditSubMode: editorState.materialEditSubMode,
        userInput: editorState.userInput,
        instructions: editorState.instructions,
        targetMaterial: editorState.targetMaterial,
        surfaceDescription: editorState.surfaceDescription,
        preserveObject: editorState.preserveObject,
        preservePerspective: editorState.preservePerspective,
        protectionRules: editorState.protectionRules,
        placement: null
      })
    });

    const payload = (await response.json()) as PostGenerationPreviewResponse & { error?: string };

    if (requestId !== promptPreviewRequestId) {
      return;
    }

    promptPreviewLoading = false;

    if (!response.ok) {
      promptPreviewError = payload.error || 'Prompt-Vorschau konnte nicht geladen werden.';
      return;
    }

    promptPreview = payload.promptDebug;
  };

  $: if (!data.debugEnabled) {
    promptPreview = null;
    promptPreviewError = '';
    promptPreviewLoading = false;
  } else if (browser && editorState) {
    if (promptPreviewTimer) {
      clearTimeout(promptPreviewTimer);
    }

    promptPreviewTimer = setTimeout(() => {
      void loadPromptPreview();
    }, 220);
  }

  const handleGenerate = async (event: CustomEvent) => {
    generationError = '';
    generationSuccess = '';

    if (event.detail.mode === 'room_placement') {
      await goto(`/room-insert?projectId=${data.project.id}&furnitureImageId=${data.image.id}`);
      return;
    }

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
        roomPreset: event.detail.roomPreset,
        materialEditSubMode: event.detail.materialEditSubMode,
        userInput: event.detail.userInput,
        instructions: event.detail.instructions,
        targetMaterial: event.detail.targetMaterial,
        surfaceDescription: event.detail.surfaceDescription,
        preserveObject: event.detail.preserveObject,
        preservePerspective: event.detail.preservePerspective,
        protectionRules: event.detail.protectionRules,
        placement: null
      })
    });

    isGenerating = false;

    const payload = (await response.json()) as PostGenerationResponse & { error?: string };

    if (!response.ok) {
      generationError = payload.error || 'Generierung fehlgeschlagen.';
      return;
    }

    latestPromptDebug = payload.promptDebug;
    promptPreview = payload.promptDebug;
    generationSuccess = `${payload.images.length} ${
      event.detail.mode === 'material_edit' ? 'Material-' : ''
    }Variante(n) wurden als neue Bilder gespeichert.`;
    await invalidateAll();
  };
</script>

<div class="split-layout">
  <div class="stack editor-page__main-column">
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
    {#if generationSuccess}
      <Card accent="blue">
        <p class="editor-page__message editor-page__message--success">{generationSuccess}</p>
      </Card>
    {/if}
    <section class="stack">
      <LibraryGrid
        items={data.variants.map((image) => ({
          id: image.id,
          title: image.title,
          project: image.projectName,
          imageId: image.id,
          time: image.createdAt,
          status: image.type,
          thumbnailUrl: image.thumbnailUrl,
          downloadUrl: image.downloadUrl,
          editUrl: image.editUrl,
          width: image.width,
          height: image.height
        }))}
        loading={Boolean($navigating)}
      />
    </section>
  </div>
  <div class="stack">
    <EditorSidebar
      error={generationError}
      initialInstructions={data.editorDefaults.instructions}
      initialLight={data.editorDefaults.lightPreset}
      initialMode={data.editorDefaults.mode}
      initialMaterialEditSubMode={data.editorDefaults.materialEditSubMode}
      initialRoomPreset={data.editorDefaults.roomPreset}
      initialStyle={data.editorDefaults.stylePreset}
      initialVariants={data.editorDefaults.variantsRequested}
      submitting={isGenerating}
      on:generate={handleGenerate}
      on:modechange={async (event) => {
        activeMode = event.detail.mode;
        if (event.detail.mode === 'room_placement') {
          await goto(`/room-insert?projectId=${data.project.id}&furnitureImageId=${data.image.id}`);
        }
      }}
      on:statechange={(event) => {
        editorState = event.detail;
      }}
    />
    {#if data.debugEnabled}
      <PromptDebugPanel
        title="Prompt-Vorschau"
        preview={promptPreview}
        loading={promptPreviewLoading}
        error={promptPreviewError}
        emptyMessage="Die Vorschau erscheint automatisch, sobald die aktuellen Editor-Einstellungen erfasst sind."
      />
    {/if}
  </div>
</div>

<div class="stack editor-page__extras">
  {#if data.debugEnabled && latestPromptDebug}
    <PromptDebugPanel
      title="Zuletzt gesendeter Prompt"
      preview={latestPromptDebug}
      accent="yellow"
      open={true}
    />
  {/if}

  <Card accent="yellow">
    <div class="stack">
      <div class="cluster">
        <strong>Versionierung</strong>
        <span class="muted">Projekt: {data.project.name}</span>
        <span class="muted"
          >Modus: {activeMode === 'material_edit'
            ? 'Stück modellieren'
            : activeMode === 'room_placement'
              ? 'Stück platzieren'
              : 'Umgebung'}</span
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

  {#if data.debugEnabled && data.image.promptSnapshot?.promptText}
    <Card>
      <div class="stack">
        <strong>Letzter Prompt</strong>
        <pre class="editor-page__prompt">{data.image.promptSnapshot.promptText}</pre>
      </div>
    </Card>
  {/if}
</div>

<style>
  .editor-page__main-column {
    min-width: 0;
  }

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
</style>
