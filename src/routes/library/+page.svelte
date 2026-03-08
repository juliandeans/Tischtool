<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  export let data;

  let projectId = data.selectedProjectId ?? data.projects[0]?.id ?? '';
  let imageType = 'upload';
  let fileInput: HTMLInputElement | null = null;
  let isUploading = false;
  let uploadError = '';

  $: projectOptions = [
    { value: '', label: 'Projekt wählen' },
    ...data.projects.map((project) => ({ value: project.id, label: project.name }))
  ];

  const submitUpload = async (event: SubmitEvent) => {
    event.preventDefault();
    uploadError = '';

    if (!projectId || !fileInput?.files?.[0]) {
      uploadError = 'Bitte Projekt und Bild auswählen.';
      return;
    }

    const formData = new FormData();
    formData.set('projectId', projectId);
    formData.set('type', imageType);
    formData.set('file', fileInput.files[0]);

    isUploading = true;

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData
    });

    isUploading = false;

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      uploadError = payload.error || 'Upload fehlgeschlagen.';
      return;
    }

    if (fileInput) {
      fileInput.value = '';
    }

    await invalidateAll();
  };
</script>

<div class="page-header">
  <span class="eyebrow">Library</span>
  <h1>Bildbibliothek</h1>
  <p>
    Bilder werden lokal gespeichert, als Thumbnail angezeigt und direkt mit der Library und den
    Projektpfaden verdrahtet.
  </p>
</div>

<div class="stack">
  <Card accent="yellow">
    <form class="upload-form" on:submit={submitUpload}>
      <Select bind:value={projectId} id="upload-project" label="Projekt" options={projectOptions} />
      <div class="upload-form__field">
        <span class="field-label">Datei</span>
        <input bind:this={fileInput} accept="image/*" type="file" />
      </div>
      {#if uploadError}
        <p class="upload-form__error">{uploadError}</p>
      {/if}
      <div class="cluster">
        <Button loading={isUploading} variant="primary">Bild hochladen</Button>
        <a href="/projects">
          <Button>Projektverwaltung</Button>
        </a>
      </div>
    </form>
  </Card>

  <LibraryGrid
    items={data.images.map((image) => ({
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
</div>

<style>
  .upload-form {
    display: grid;
    gap: var(--space-3);
  }

  .upload-form__field {
    display: grid;
    gap: 8px;
  }

  .field-label {
    font-size: 0.95rem;
    font-weight: 600;
  }

  input[type='file'] {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-input);
    box-shadow: var(--color-shadow-inset);
    min-height: 44px;
    padding: 10px 14px;
  }

  .upload-form__error {
    color: var(--color-red);
    margin: 0;
  }
</style>
