<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import PromptDebugPanel from '$lib/components/ui/PromptDebugPanel.svelte';
  import RoomPlacementCanvas from '$lib/components/room-insert/RoomPlacementCanvas.svelte';
  import RoomInsertSidebar from '$lib/components/room-insert/RoomInsertSidebar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { PostGenerationPreviewResponse, PostGenerationResponse } from '$lib/types/api';
  import type { PromptDebugPreview, RoomPreset } from '$lib/types/generation';
  import type { ImagePlacement } from '$lib/types/image';

  export let data;

  let generationError = '';
  let generationSuccess = '';
  let uploadError = '';
  let uploadSuccess = '';
  let isGenerating = false;
  let isUploadingRoomPhoto = false;
  let selectedProjectId = data.selectedProjectId ?? '';
  let selectedRoomImageId =
    data.selectedRoomImageId && data.images.some((image) => image.id === data.selectedRoomImageId)
      ? data.selectedRoomImageId
      : (data.images[0]?.id ?? '');
  let selectedFurnitureImageId =
    data.selectedFurnitureImageId &&
    data.images.some((image) => image.id === data.selectedFurnitureImageId)
      ? data.selectedFurnitureImageId
      : (data.images.find((image) => image.id !== selectedRoomImageId)?.id ?? '');
  let stylePreset = 'original';
  let lightPreset = 'original';
  let roomPreset: RoomPreset = 'modern_living';
  let variantsRequested = '1';
  let instructions = '';
  let placement: ImagePlacement | null = null;
  let promptPreview: PromptDebugPreview | null = null;
  let promptPreviewError = '';
  let promptPreviewLoading = false;
  let latestPromptDebug: PromptDebugPreview | null = null;
  let roomInsertState: {
    roomImageId: string;
    furnitureImageId: string;
    stylePreset: string;
    lightPreset: string;
    roomPreset: string;
    variantsRequested: number;
    userInput: string;
    instructions: string;
    preserveObject: boolean;
    preservePerspective: boolean;
    protectionRules: Record<string, boolean>;
  } | null = null;
  let promptPreviewTimer: ReturnType<typeof setTimeout> | null = null;
  let promptPreviewRequestId = 0;

  $: projectOptions = [
    { value: '', label: 'Projekt wählen' },
    ...data.projects.map((project) => ({ value: project.id, label: project.name }))
  ];
  $: imageOptions = data.images.map((image) => ({
    value: image.id,
    label: `${image.title} · ${image.type}`
  }));
  $: roomImageOptions = [{ value: '', label: 'Raumfoto wählen' }, ...imageOptions];
  $: furnitureImageOptions = [
    { value: '', label: 'Möbelbild wählen' },
    ...imageOptions.filter((image) => image.value !== selectedRoomImageId)
  ];
  $: if (selectedRoomImageId && !data.images.some((image) => image.id === selectedRoomImageId)) {
    selectedRoomImageId = '';
  }
  $: if (
    selectedFurnitureImageId &&
    !data.images.some((image) => image.id === selectedFurnitureImageId)
  ) {
    selectedFurnitureImageId = '';
  }
  $: if (!selectedRoomImageId && data.images[0]) {
    selectedRoomImageId = data.images[0].id;
  }
  $: if (
    (!selectedFurnitureImageId || selectedFurnitureImageId === selectedRoomImageId) &&
    data.images.some((image) => image.id !== selectedRoomImageId)
  ) {
    selectedFurnitureImageId =
      data.images.find((image) => image.id !== selectedRoomImageId)?.id ?? '';
  }
  $: roomImage = data.images.find((image) => image.id === selectedRoomImageId) ?? null;
  $: furnitureImage = data.images.find((image) => image.id === selectedFurnitureImageId) ?? null;

  const loadPromptPreview = async () => {
    if (
      !browser ||
      !data.debugEnabled ||
      !roomInsertState ||
      !selectedProjectId ||
      !roomInsertState.furnitureImageId
    ) {
      promptPreviewLoading = false;
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
        projectId: selectedProjectId,
        sourceImageId: roomInsertState.furnitureImageId,
        mode: 'room_placement',
        variantsRequested: roomInsertState.variantsRequested,
        stylePreset: roomInsertState.stylePreset,
        lightPreset: roomInsertState.lightPreset,
        roomPreset: roomInsertState.roomPreset,
        userInput: roomInsertState.userInput,
        instructions: roomInsertState.instructions,
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: roomInsertState.preserveObject,
        preservePerspective: roomInsertState.preservePerspective,
        protectionRules: roomInsertState.protectionRules,
        placement: placement
          ? {
              roomImageId: roomInsertState.roomImageId,
              x: placement.x,
              y: placement.y,
              width: placement.width,
              height: placement.height
            }
          : null
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
  } else if (browser && roomInsertState && selectedProjectId && roomInsertState.furnitureImageId) {
    if (promptPreviewTimer) {
      clearTimeout(promptPreviewTimer);
    }

    promptPreviewTimer = setTimeout(() => {
      void loadPromptPreview();
    }, 220);
  } else if (!selectedProjectId || !roomInsertState?.furnitureImageId) {
    promptPreview = null;
    promptPreviewError = '';
    promptPreviewLoading = false;
  }

  const handleProjectChange = async (event: CustomEvent<string>) => {
    const projectId = event.detail;

    generationError = '';
    generationSuccess = '';
    uploadError = '';
    uploadSuccess = '';
    placement = null;
    latestPromptDebug = null;
    promptPreview = null;
    promptPreviewError = '';

    await goto(projectId ? `/room-insert?projectId=${projectId}` : '/room-insert');
  };

  const handleModeChange = async (
    event: CustomEvent<'environment_edit' | 'material_edit' | 'room_placement'>
  ) => {
    if (event.detail === 'room_placement') {
      return;
    }

    const targetImageId = selectedFurnitureImageId || selectedRoomImageId || data.images[0]?.id;

    if (targetImageId) {
      await goto(`/editor/${targetImageId}`);
    }
  };

  const handleRoomUpload = async (event: CustomEvent<{ file: File }>) => {
    uploadError = '';
    uploadSuccess = '';

    if (!selectedProjectId) {
      uploadError = 'Bitte zuerst ein Projekt wählen.';
      return;
    }

    isUploadingRoomPhoto = true;

    const formData = new FormData();
    formData.set('projectId', selectedProjectId);
    formData.set('type', 'upload');
    formData.set('file', event.detail.file);

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData
    });

    isUploadingRoomPhoto = false;

    const payload = await response.json();

    if (!response.ok) {
      uploadError = payload.error || 'Raumfoto konnte nicht hochgeladen werden.';
      return;
    }

    selectedRoomImageId = payload.image.id;
    uploadSuccess = 'Raumfoto wurde gespeichert und steht sofort für die Platzierung bereit.';
    await invalidateAll();
  };

  const handleGenerate = async (
    event: CustomEvent<{
      roomImageId: string;
      furnitureImageId: string;
      stylePreset: string;
      lightPreset: string;
      roomPreset: string;
      variantsRequested: number;
      userInput: string;
      instructions: string;
      preserveObject: boolean;
      preservePerspective: boolean;
      protectionRules: Record<string, boolean>;
    }>
  ) => {
    generationError = '';
    generationSuccess = '';

    if (!selectedProjectId || !placement) {
      generationError = 'Projekt und Zielregion sind erforderlich.';
      return;
    }

    isGenerating = true;

    const response = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        projectId: selectedProjectId,
        sourceImageId: event.detail.furnitureImageId,
        mode: 'room_placement',
        variantsRequested: event.detail.variantsRequested,
        stylePreset: event.detail.stylePreset,
        lightPreset: event.detail.lightPreset,
        roomPreset: event.detail.roomPreset,
        userInput: event.detail.userInput,
        instructions: event.detail.instructions,
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: event.detail.preserveObject,
        preservePerspective: event.detail.preservePerspective,
        protectionRules: event.detail.protectionRules,
        placement: {
          roomImageId: event.detail.roomImageId,
          x: placement.x,
          y: placement.y,
          width: placement.width,
          height: placement.height
        }
      })
    });

    isGenerating = false;

    const payload = (await response.json()) as PostGenerationResponse & { error?: string };

    if (!response.ok) {
      generationError = payload.error || 'Raumvariante konnte nicht generiert werden.';
      return;
    }

    latestPromptDebug = payload.promptDebug;
    promptPreview = payload.promptDebug;
    generationSuccess = `${payload.images.length} Raumvariante(n) wurden gespeichert.`;
    await invalidateAll();
  };
</script>

{#if data.projects.length === 0}
  <EmptyState
    title="Noch kein Projekt vorhanden"
    description="Lege zuerst ein Projekt an. Danach kannst du Raumfotos hochladen und Möbelbilder zuordnen."
    accent="red"
  >
    <Button slot="actions" href="/projects" type="button" variant="primary">Projekt anlegen</Button>
  </EmptyState>
{:else}
  {#if data.images.length === 0}
    <div class="stack">
      <EmptyState
        title="Noch keine Bilder im Projekt"
        description="Für Stück platzieren brauchst du mindestens ein Raumfoto und ein Möbelbild im gewählten Projekt."
        accent="yellow"
      >
        <Button slot="actions" href={`/library?projectId=${selectedProjectId}`} variant="primary">
          Bilder hochladen
        </Button>
      </EmptyState>
      <RoomInsertSidebar
        bind:projectId={selectedProjectId}
        bind:roomImageId={selectedRoomImageId}
        bind:furnitureImageId={selectedFurnitureImageId}
        bind:stylePreset
        bind:lightPreset
        bind:roomPreset
        bind:variantsRequested
        bind:instructions
        error={generationError}
        {uploadError}
        success={generationSuccess}
        {uploadSuccess}
        uploadingRoomPhoto={isUploadingRoomPhoto}
        furnitureImageLabel={furnitureImage?.title ?? ''}
        {furnitureImageOptions}
        {placement}
        {projectOptions}
        roomImageLabel={roomImage?.title ?? ''}
        {roomImageOptions}
        submitting={isGenerating}
        on:generate={handleGenerate}
        on:modechange={handleModeChange}
        on:projectchange={handleProjectChange}
        on:statechange={(event) => {
          roomInsertState = event.detail;
        }}
        on:uploadroom={handleRoomUpload}
      />
      {#if data.debugEnabled}
        <PromptDebugPanel
          title="Prompt-Vorschau"
          preview={promptPreview}
          loading={promptPreviewLoading}
          error={promptPreviewError}
          emptyMessage="Wähle Projekt und Möbelbild, dann erscheint hier die aktuelle Stück-platzieren-Prompt-Vorschau."
        />
      {/if}
    </div>
  {:else}
    <div class="split-layout room-insert__workspace">
      <RoomPlacementCanvas
        roomImageUrl={roomImage?.downloadUrl ?? ''}
        roomImageTitle={roomImage?.title ?? ''}
        imageWidth={roomImage?.width ?? null}
        imageHeight={roomImage?.height ?? null}
        {placement}
        on:change={(event) => {
          placement = event.detail;
        }}
        on:reset={() => {
          placement = null;
        }}
      />
      <div class="stack">
        <RoomInsertSidebar
          bind:projectId={selectedProjectId}
          bind:roomImageId={selectedRoomImageId}
          bind:furnitureImageId={selectedFurnitureImageId}
          bind:stylePreset
          bind:lightPreset
          bind:roomPreset
          bind:variantsRequested
          bind:instructions
          error={generationError}
          {uploadError}
          success={generationSuccess}
          {uploadSuccess}
          uploadingRoomPhoto={isUploadingRoomPhoto}
          furnitureImageLabel={furnitureImage?.title ?? ''}
          {furnitureImageOptions}
          {placement}
          {projectOptions}
          roomImageLabel={roomImage?.title ?? ''}
          {roomImageOptions}
          submitting={isGenerating}
          on:generate={handleGenerate}
          on:modechange={handleModeChange}
          on:projectchange={handleProjectChange}
          on:statechange={(event) => {
            roomInsertState = event.detail;
          }}
          on:uploadroom={handleRoomUpload}
        />
        {#if data.debugEnabled}
          <PromptDebugPanel
            title="Prompt-Vorschau"
            preview={promptPreview}
            loading={promptPreviewLoading}
            error={promptPreviewError}
            emptyMessage="Wähle Projekt und Möbelbild, dann erscheint hier die aktuelle Stück-platzieren-Prompt-Vorschau."
          />
        {/if}
      </div>
    </div>
  {/if}

  <div class="stack room-insert__extras">
    {#if data.debugEnabled && latestPromptDebug}
      <PromptDebugPanel
        title="Zuletzt gesendeter Prompt"
        preview={latestPromptDebug}
        accent="yellow"
        open={true}
      />
    {/if}

    {#if data.images.length < 2}
      <Card accent="yellow">
        <p class="room-insert__hint">
          Für eine Stück-platzieren-Variante brauchst du mindestens zwei Bilder im Projekt: ein
          Raumfoto und ein Möbelbild.
        </p>
      </Card>
    {/if}

    <section class="stack">
      <div class="section-header room-insert__results-header">
        <h2>Gespeicherte Raumvarianten</h2>
        <p>
          Diese Varianten bleiben in der Bibliothek sichtbar und können später erneut im Editor
          geöffnet werden.
        </p>
      </div>

      <LibraryGrid
        items={data.roomInsertResults.map((image) => ({
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
{/if}

<style>
  .room-insert__workspace {
    grid-template-columns: minmax(0, 1fr) 320px;
    padding-right: 1px;
  }

  .room-insert__extras {
    margin-top: var(--space-4);
  }

  .room-insert__hint {
    margin: 0;
  }

  .room-insert__results-header {
    margin-bottom: 0;
  }

  @media (max-width: 960px) {
    .room-insert__workspace {
      grid-template-columns: 1fr;
      padding-right: 0;
    }
  }
</style>
