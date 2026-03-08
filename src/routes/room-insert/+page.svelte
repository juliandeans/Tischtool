<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import RoomPlacementCanvas from '$lib/components/room-insert/RoomPlacementCanvas.svelte';
  import RoomInsertSidebar from '$lib/components/room-insert/RoomInsertSidebar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { ImagePlacement } from '$lib/types/image';

  export let data;

  let generationError = '';
  let generationSuccess = '';
  let uploadError = '';
  let uploadSuccess = '';
  let isGenerating = false;
  let isUploadingRoomPhoto = false;
  let selectedProjectId = data.selectedProjectId ?? '';
  let selectedRoomImageId = data.images[0]?.id ?? '';
  let selectedFurnitureImageId =
    data.images.find((image) => image.id !== selectedRoomImageId)?.id ?? '';
  let stylePreset = 'original';
  let lightPreset = 'original';
  let variantsRequested = '2';
  let instructions = '';
  let placement: ImagePlacement | null = null;

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

  const handleProjectChange = async (event: CustomEvent<string>) => {
    const projectId = event.detail;

    generationError = '';
    generationSuccess = '';
    uploadError = '';
    uploadSuccess = '';
    placement = null;

    await goto(projectId ? `/room-insert?projectId=${projectId}` : '/room-insert');
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
      variantsRequested: number;
      instructions: string;
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
        mode: 'room_insert',
        variantsRequested: event.detail.variantsRequested,
        stylePreset: event.detail.stylePreset,
        lightPreset: event.detail.lightPreset,
        instructions: event.detail.instructions,
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: true,
        preservePerspective: true,
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

    const payload = await response.json();

    if (!response.ok) {
      generationError = payload.error || 'Raumvariante konnte nicht generiert werden.';
      return;
    }

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
        description="Für room_insert brauchst du mindestens ein Raumfoto und ein Möbelbild im gewählten Projekt."
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
        bind:variantsRequested
        bind:instructions
        error={generationError}
        {uploadError}
        success={generationSuccess}
        {uploadSuccess}
        uploadingRoomPhoto={isUploadingRoomPhoto}
        furnitureImageLabel={furnitureImage?.title ?? ''}
        {furnitureImageOptions}
        lightOptions={data.lightOptions}
        {placement}
        {projectOptions}
        roomImageLabel={roomImage?.title ?? ''}
        {roomImageOptions}
        styleOptions={data.styleOptions}
        submitting={isGenerating}
        on:generate={handleGenerate}
        on:projectchange={handleProjectChange}
        on:uploadroom={handleRoomUpload}
      />
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
      <RoomInsertSidebar
        bind:projectId={selectedProjectId}
        bind:roomImageId={selectedRoomImageId}
        bind:furnitureImageId={selectedFurnitureImageId}
        bind:stylePreset
        bind:lightPreset
        bind:variantsRequested
        bind:instructions
        error={generationError}
        {uploadError}
        success={generationSuccess}
        {uploadSuccess}
        uploadingRoomPhoto={isUploadingRoomPhoto}
        furnitureImageLabel={furnitureImage?.title ?? ''}
        {furnitureImageOptions}
        lightOptions={data.lightOptions}
        {placement}
        {projectOptions}
        roomImageLabel={roomImage?.title ?? ''}
        {roomImageOptions}
        styleOptions={data.styleOptions}
        submitting={isGenerating}
        on:generate={handleGenerate}
        on:projectchange={handleProjectChange}
        on:uploadroom={handleRoomUpload}
      />
    </div>
  {/if}

  <div class="stack room-insert__extras">
    {#if data.images.length < 2}
      <Card accent="yellow">
        <p class="room-insert__hint">
          Für eine room_insert-Variante brauchst du mindestens zwei Bilder im Projekt: ein Raumfoto
          und ein Möbelbild.
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
    grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
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
