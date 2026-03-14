<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { navigating } from '$app/stores';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  export let data;

  let projectId = data.selectedProjectId ?? '';
  let imageType = 'upload';
  let fileInput: HTMLInputElement | null = null;
  let isUploading = false;
  let deletingImageId = '';
  let uploadError = '';
  let uploadSuccess = '';
  let selectedFileName = '';

  $: projectOptions = [
    { value: '', label: 'Projekt wählen' },
    ...data.projects.map((project) => ({ value: project.id, label: project.name }))
  ];

  const submitUpload = async (event: SubmitEvent) => {
    event.preventDefault();
    uploadError = '';
    uploadSuccess = '';

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
    selectedFileName = '';

    uploadSuccess = 'Bild wurde gespeichert und ist jetzt in der Library sichtbar.';
    await invalidateAll();
  };

  const deleteImage = async (imageId: string) => {
    uploadError = '';
    uploadSuccess = '';
    deletingImageId = imageId;

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        uploadError = payload.error || 'Bild konnte nicht gelöscht werden.';
        return;
      }

      uploadSuccess = 'Bild wurde aus der Bibliothek gelöscht.';
      await invalidateAll();
    } catch {
      uploadError = 'Bild konnte nicht gelöscht werden.';
    } finally {
      deletingImageId = '';
    }
  };
</script>

<div class="stack">
  <Card accent="yellow">
    {#if data.projects.length === 0}
      <EmptyState
        title="Zuerst ein Projekt anlegen"
        description="Uploads brauchen ein Projekt. Lege erst ein Projekt an oder kehre danach zur Library zurück."
        accent="yellow"
      >
        <Button slot="actions" href="/projects" type="button" variant="primary">
          Projekt anlegen
        </Button>
      </EmptyState>
    {:else}
      <form class="upload-form" on:submit={submitUpload}>
        <div class="upload-form__row">
          <Select
            bind:value={projectId}
            id="upload-project"
            label="Projekt"
            options={projectOptions}
            on:change={() => goto(projectId ? `/library?projectId=${projectId}` : '/library')}
          />
          <div class="upload-form__field">
            <span class="field-label">Datei</span>
            <div class="upload-picker">
              <input
                bind:this={fileInput}
                accept="image/*"
                class="visually-hidden"
                id="library-file"
                type="file"
                on:change={(event) => {
                  const target = event.currentTarget as HTMLInputElement;
                  selectedFileName = target.files?.[0]?.name ?? '';
                }}
              />
              <label class="upload-picker__trigger" for="library-file">
                {selectedFileName || 'Bild auswählen'}
              </label>
            </div>
          </div>
          <div class="upload-form__actions">
            <Button type="submit" loading={isUploading} variant="primary">Bild hochladen</Button>
          </div>
        </div>
        {#if uploadError}
          <p class="upload-form__error">{uploadError}</p>
        {/if}
        {#if uploadSuccess}
          <p class="upload-form__success">{uploadSuccess}</p>
        {/if}
      </form>
    {/if}
  </Card>

  <LibraryGrid
    items={data.images.map((image) => ({
      id: image.id,
      title: image.title,
      project: image.projectName,
      time: image.createdAt,
      status: image.type,
      thumbnailUrl: image.thumbnailUrl,
      previewUrl: `/api/images/${image.id}/download`,
      downloadUrl: image.downloadUrl,
      editUrl: image.editUrl
    }))}
    deletingId={deletingImageId}
    loading={Boolean($navigating)}
    on:delete={(event) => deleteImage(event.detail.id)}
  />
</div>

<style>
  .upload-form {
    display: grid;
    gap: var(--space-3);
  }

  .upload-form__row {
    align-items: end;
    display: grid;
    gap: var(--space-3);
    grid-template-columns: minmax(220px, 320px) minmax(0, 1fr) auto;
  }

  .upload-form__field {
    display: grid;
    gap: 8px;
  }

  .upload-picker {
    align-items: center;
    display: flex;
  }

  .upload-picker__trigger {
    align-items: center;
    align-self: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: var(--color-shadow-inset);
    cursor: pointer;
    display: inline-flex;
    font-weight: 600;
    justify-content: center;
    line-height: 1;
    min-height: 44px;
    padding: 0 18px;
    text-decoration: none;
  }

  .upload-picker__trigger:hover {
    transform: translateY(0px);
  }

  .upload-picker__trigger:focus-within,
  .upload-picker__trigger:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: 2px;
  }

  .field-label {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .upload-form__error {
    color: var(--color-red);
    margin: 0;
  }

  .upload-form__success {
    color: var(--color-blue);
    font-weight: 600;
    margin: 0;
  }

  .upload-form__actions {
    display: flex;
  }

  @media (max-width: 720px) {
    .upload-form__row,
    .upload-picker {
      grid-template-columns: 1fr;
    }

    .upload-form__actions {
      justify-content: flex-start;
    }
  }
</style>
