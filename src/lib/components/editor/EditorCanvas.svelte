<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  import Card from '$lib/components/ui/Card.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import { toShortDate } from '$lib/utils/dates';
  import type { PatchImageTitleResponse } from '$lib/types/api';

  export let imageId = '';
  export let title = '';
  export let imageUrl = '';
  export let projectName = '';
  export let type = 'upload';
  export let createdAt = '';
  export let width: number | null = null;
  export let height: number | null = null;

  let currentTitle = title;
  let draftTitle = title;
  let isEditingTitle = false;
  let isSavingTitle = false;
  let renameError = '';

  $: if (!isEditingTitle) {
    currentTitle = title;
    draftTitle = title;
  }

  $: typeLabel = type === 'generated' ? 'Generiert' : type === 'original' ? 'Original' : 'Upload';

  const startRename = () => {
    draftTitle = currentTitle;
    renameError = '';
    isEditingTitle = true;
  };

  const cancelRename = () => {
    draftTitle = currentTitle;
    renameError = '';
    isEditingTitle = false;
  };

  const submitRename = async () => {
    const nextTitle = draftTitle.trim();

    if (!nextTitle) {
      renameError = 'Bildname darf nicht leer sein.';
      return;
    }

    isSavingTitle = true;
    renameError = '';

    const response = await fetch(`/api/images/${imageId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: nextTitle
      })
    });

    const payload = (await response.json()) as PatchImageTitleResponse & { error?: string };

    isSavingTitle = false;

    if (!response.ok) {
      renameError = payload.error || 'Bildname konnte nicht gespeichert werden.';
      return;
    }

    currentTitle = payload.image.title;
    draftTitle = payload.image.title;
    isEditingTitle = false;
    await invalidateAll();
  };
</script>

<div class="canvas-card">
  <Card padded={false}>
    <div class="canvas">
      <img class="canvas__image" src={imageUrl} alt={currentTitle} />
    </div>
    <div class="canvas__meta">
      <div class="canvas__header">
        <div class="canvas__title-block">
          {#if isEditingTitle}
            <form class="inline-rename-form" on:submit|preventDefault={submitRename}>
              <input
                class="inline-rename-input"
                type="text"
                bind:value={draftTitle}
                maxlength="120"
                aria-label="Bildnamen bearbeiten"
                disabled={isSavingTitle}
              />
              <div class="inline-rename-actions">
                <button
                  class="inline-rename-button inline-rename-button--save"
                  disabled={isSavingTitle}
                >
                  {isSavingTitle ? 'Speichert...' : 'Speichern'}
                </button>
                <button
                  class="inline-rename-button"
                  type="button"
                  disabled={isSavingTitle}
                  on:click={cancelRename}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          {:else}
            <div class="canvas__title-row">
              <strong>{currentTitle}</strong>
              <span class="canvas__edit-button">
                <IconButton label="Bildnamen bearbeiten" on:click={startRename}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M4 16.75V20h3.25L18 9.25 14.75 6 4 16.75Zm16.71-9.04a1.003 1.003 0 0 0 0-1.42l-2-2a1.003 1.003 0 0 0-1.42 0l-1.13 1.13L19.58 8.84l1.13-1.13Z"
                      fill="currentColor"
                    />
                  </svg>
                </IconButton>
              </span>
            </div>
          {/if}
          {#if renameError}
            <p class="inline-rename-error">{renameError}</p>
          {/if}
        </div>
      </div>
      <div class="canvas__details">
        <span>Projekt: {projectName}</span>
        <span>ID: {imageId}</span>
        {#if width && height}
          <span>{width} × {height}px</span>
        {/if}
        {#if createdAt}
          <span>{toShortDate(createdAt)}</span>
        {/if}
        <span>{typeLabel}</span>
      </div>
    </div>
  </Card>
</div>

<style>
  .canvas-card {
    min-height: 520px;
    overflow: hidden;
  }

  .canvas {
    align-items: center;
    background: var(--color-surface);
    display: grid;
    min-height: 520px;
    overflow: hidden;
    place-items: center;
  }

  .canvas__image {
    display: block;
    max-height: 520px;
    object-fit: contain;
    width: 100%;
  }

  .canvas__meta {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
  }

  .canvas__header {
    align-items: start;
    display: flex;
    gap: var(--space-2);
    justify-content: space-between;
  }

  .canvas__title-block {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .canvas__title-row {
    align-items: center;
    display: flex;
    gap: 10px;
    min-width: 0;
  }

  strong {
    display: block;
    margin-top: 4px;
    overflow-wrap: anywhere;
  }

  .canvas__details {
    color: var(--color-text-muted);
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 0.9rem;
  }

  .canvas__edit-button {
    flex: 0 0 auto;
    opacity: 0;
    transition: opacity 120ms ease;
    border-radius: 2px;
  }

  .canvas__edit-button :global(button) {
    height: 32px;
    width: 32px;
    border-radius: 2px;
  }

  .canvas__edit-button :global(svg) {
    height: 16px;
    width: 16px;
  }

  .canvas__meta:hover .canvas__edit-button,
  .canvas__meta:focus-within .canvas__edit-button {
    opacity: 1;
  }

</style>
