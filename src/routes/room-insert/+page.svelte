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
  import Select from '$lib/components/ui/Select.svelte';
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
  let isUploadingFurniturePhoto = false;
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
  let roomFileInput: HTMLInputElement | null = null;
  let furnitureFileInput: HTMLInputElement | null = null;
  let selectedRoomFile: File | null = null;
  let selectedFurnitureFile: File | null = null;
  let selectedRoomFileName = '';
  let selectedFurnitureFileName = '';
  let lastDataSelectedProjectId = data.selectedProjectId ?? '';
  let lastDataSelectedRoomImageId = data.selectedRoomImageId ?? '';
  let lastDataSelectedFurnitureImageId = data.selectedFurnitureImageId ?? '';

  $: projectOptions = [
    { value: '', label: 'Projekt wählen' },
    ...data.projects.map((project) => ({ value: project.id, label: project.name }))
  ];
  $: {
    const nextProjectId = data.selectedProjectId ?? '';

    if (nextProjectId !== lastDataSelectedProjectId) {
      lastDataSelectedProjectId = nextProjectId;
      selectedProjectId = nextProjectId;
    }
  }
  $: {
    const nextRoomImageId = data.selectedRoomImageId ?? '';

    if (nextRoomImageId !== lastDataSelectedRoomImageId) {
      lastDataSelectedRoomImageId = nextRoomImageId;
      if (nextRoomImageId) {
        selectedRoomImageId = nextRoomImageId;
      }
    }
  }
  $: {
    const nextFurnitureImageId = data.selectedFurnitureImageId ?? '';

    if (nextFurnitureImageId !== lastDataSelectedFurnitureImageId) {
      lastDataSelectedFurnitureImageId = nextFurnitureImageId;
      if (nextFurnitureImageId) {
        selectedFurnitureImageId = nextFurnitureImageId;
      }
    }
  }
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
    selectedRoomFileName = '';
    selectedRoomFile = null;
    if (roomFileInput) {
      roomFileInput.value = '';
    }
    uploadSuccess = 'Raumfoto wurde gespeichert und steht sofort für die Platzierung bereit.';
    await goto(
      `/room-insert?projectId=${selectedProjectId}&roomImageId=${payload.image.id}${
        selectedFurnitureImageId ? `&furnitureImageId=${selectedFurnitureImageId}` : ''
      }`
    );
  };

  const handleFurnitureUpload = async (event: CustomEvent<{ file: File }>) => {
    uploadError = '';
    uploadSuccess = '';

    if (!selectedProjectId) {
      uploadError = 'Bitte zuerst ein Projekt wählen.';
      return;
    }

    isUploadingFurniturePhoto = true;

    const formData = new FormData();
    formData.set('projectId', selectedProjectId);
    formData.set('type', 'upload');
    formData.set('file', event.detail.file);

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData
    });

    isUploadingFurniturePhoto = false;

    const payload = await response.json();

    if (!response.ok) {
      uploadError = payload.error || 'Objektbild konnte nicht hochgeladen werden.';
      return;
    }

    selectedFurnitureImageId = payload.image.id;
    selectedFurnitureFileName = '';
    selectedFurnitureFile = null;
    if (furnitureFileInput) {
      furnitureFileInput.value = '';
    }
    uploadSuccess = 'Objektbild wurde gespeichert und steht sofort für die Platzierung bereit.';
    await goto(
      `/room-insert?projectId=${selectedProjectId}&furnitureImageId=${payload.image.id}${
        selectedRoomImageId ? `&roomImageId=${selectedRoomImageId}` : ''
      }`
    );
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
  <div class="split-layout room-insert__workspace">
    <div class="stack room-insert__main-column">
      <Card accent="blue">
        <div class="stack">
          <div>
            <div class="eyebrow">Objekt</div>
            <h2>Stück auswählen</h2>
          </div>

          <div class="room-insert__preview-card">
            {#if furnitureImage}
              <img
                class="room-insert__preview-image"
                src={furnitureImage.downloadUrl}
                alt={furnitureImage.title}
              />
            {:else}
              <div class="room-insert__preview-empty">Noch kein Objekt gewählt</div>
            {/if}
          </div>

          <div class="room-insert__selector-row">
            <Select
              bind:value={selectedFurnitureImageId}
              id="room-furniture"
              label="Bild aus der Bibliothek"
              options={furnitureImageOptions}
            />
            <div class="room-insert__upload-column">
              <span class="room-insert__upload-label">Neues Objekt hochladen</span>
              <div class="room-insert__actions-row">
                <input
                  bind:this={furnitureFileInput}
                  accept="image/*"
                  class="visually-hidden"
                  id="furniture-file"
                  type="file"
                  on:change={(event) => {
                    const target = event.currentTarget as HTMLInputElement;
                    selectedFurnitureFile = target.files?.[0] ?? null;
                    selectedFurnitureFileName = selectedFurnitureFile?.name ?? '';
                  }}
                />
                <label class="room-insert__file-trigger" for="furniture-file">
                  {selectedFurnitureFileName || 'Objekt wählen'}
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isUploadingFurniturePhoto}
                  disabled={!selectedProjectId || !selectedFurnitureFile}
                  on:click={() => {
                    if (selectedFurnitureFile) {
                      void handleFurnitureUpload({
                        detail: { file: selectedFurnitureFile }
                      } as CustomEvent<{ file: File }>);
                    }
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card accent="red">
        <div class="stack">
          <div>
            <div class="eyebrow">Raum</div>
            <h2>Raumfoto auswählen</h2>
          </div>

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

          <div class="room-insert__selector-row">
            <Select
              bind:value={selectedRoomImageId}
              id="room-image"
              label="Bild aus der Bibliothek"
              options={roomImageOptions}
            />
            <div class="room-insert__upload-column">
              <span class="room-insert__upload-label">Neues Raumfoto hochladen</span>
              <div class="room-insert__actions-row">
                <input
                  bind:this={roomFileInput}
                  accept="image/*"
                  class="visually-hidden"
                  id="room-file"
                  type="file"
                  on:change={(event) => {
                    const target = event.currentTarget as HTMLInputElement;
                    selectedRoomFile = target.files?.[0] ?? null;
                    selectedRoomFileName = selectedRoomFile?.name ?? '';
                  }}
                />
                <label class="room-insert__file-trigger" for="room-file">
                  {selectedRoomFileName || 'Raumfoto wählen'}
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isUploadingRoomPhoto}
                  disabled={!selectedProjectId || !selectedRoomFile}
                  on:click={() => {
                    if (selectedRoomFile) {
                      void handleRoomUpload({
                        detail: { file: selectedRoomFile }
                      } as CustomEvent<{ file: File }>);
                    }
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <div class="stack">
      <RoomInsertSidebar
        bind:roomImageId={selectedRoomImageId}
        bind:furnitureImageId={selectedFurnitureImageId}
        bind:stylePreset
        bind:lightPreset
        bind:roomPreset
        bind:variantsRequested
        bind:instructions
        error={generationError || uploadError}
        success={generationSuccess || uploadSuccess}
        submitting={isGenerating}
        on:generate={handleGenerate}
        on:modechange={handleModeChange}
        on:statechange={(event) => {
          roomInsertState = event.detail;
        }}
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

  .room-insert__main-column {
    min-width: 0;
  }

  .room-insert__preview-card {
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    display: grid;
    min-height: 280px;
    overflow: hidden;
    place-items: center;
  }

  .room-insert__preview-image {
    display: block;
    max-height: 480px;
    max-width: 100%;
    object-fit: contain;
    width: 100%;
  }

  .room-insert__preview-empty {
    color: var(--color-text-muted);
    padding: var(--space-4);
  }

  .room-insert__selector-row {
    align-items: end;
    display: grid;
    gap: var(--space-3);
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .room-insert__upload-column {
    display: grid;
    gap: 8px;
  }

  .room-insert__upload-label {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .room-insert__actions-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .room-insert__file-trigger {
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: var(--color-shadow-inset);
    cursor: pointer;
    display: inline-flex;
    min-height: 44px;
    padding: 0 18px;
  }

  .visually-hidden {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
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

    .room-insert__selector-row {
      grid-template-columns: 1fr;
    }
  }
</style>
