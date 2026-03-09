<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';

  import { imageAlt } from '$lib/utils/image';
  import Card from '$lib/components/ui/Card.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import type { PatchImageTitleResponse } from '$lib/types/api';

  const dispatch = createEventDispatcher<{
    delete: { id: string };
    preview: { src: string; title: string };
  }>();

  export let id = '';
  export let title = '';
  export let project = '';
  export let imageId = '';
  export let time = '';
  export let status = '';
  export let thumbnailUrl = '';
  export let previewUrl = '';
  export let downloadUrl = '';
  export let editUrl = '';
  export let deleting = false;
  export let width: number | null = null;
  export let height: number | null = null;

  let isEditingTitle = false;
  let currentTitle = title;
  let draftTitle = title;
  let renameError = '';
  let isSavingTitle = false;

  $: if (!isEditingTitle) {
    currentTitle = title;
    draftTitle = title;
  }

  const startRename = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
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

    const response = await fetch(`/api/images/${id}`, {
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

  const openPreview = () => {
    dispatch('preview', {
      src: previewUrl || thumbnailUrl,
      title: currentTitle
    });
  };
</script>

<div class="image-card">
  <Card padded={false}>
    <button
      aria-label={`${title} als Vorschau öffnen`}
      class="image-card__link"
      type="button"
      on:click={openPreview}
    ></button>
    <img class="image-card__preview" src={thumbnailUrl} alt={imageAlt(title)} loading="lazy" />
    <div class="image-card__overlay image-card__overlay--left">
      <IconButton
        label="Löschen"
        variant="neutral"
        disabled={deleting}
        on:click={() => dispatch('delete', { id })}
      >
        <span aria-hidden="true">🗑</span>
      </IconButton>
    </div>
    <div class="image-card__overlay">
      <IconButton href={downloadUrl} label="Download" download variant="neutral">
        <span aria-hidden="true">↓</span>
      </IconButton>
      <IconButton href={editUrl} label="Edit" variant="primary">
        <span aria-hidden="true">✎</span>
      </IconButton>
    </div>
    <div class="image-card__body">
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
          {#if renameError}
            <p class="inline-rename-error">{renameError}</p>
          {/if}
        </form>
      {:else}
        <div class="image-card__title-row">
          <h3>{currentTitle}</h3>
          <span class="image-card__rename-trigger">
            <IconButton label="Umbenennen" variant="neutral" on:click={startRename}>
              <span aria-hidden="true">✎</span>
            </IconButton>
          </span>
        </div>
      {/if}
      <div class="image-card__details">
        <span>Projekt: {project}</span>
        {#if imageId}
          <span>ID: {imageId}</span>
        {/if}
        {#if width && height}
          <span>{width} × {height}px</span>
        {/if}
      </div>
      <div class="image-card__meta">
        <span>{time}</span>
        {#if status}
          <span>{status}</span>
        {/if}
      </div>
    </div>
  </Card>
</div>

<style>
  .image-card {
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .image-card :global(section) {
    height: 100%;
    position: relative;
  }

  .image-card__link {
    appearance: none;
    background: transparent;
    border: 0;
    cursor: zoom-in;
    inset: 0;
    position: absolute;
    padding: 0;
    z-index: 1;
  }

  .image-card__preview {
    aspect-ratio: 4 / 3;
    background: var(--color-surface-muted);
    object-fit: cover;
    width: 100%;
  }

  .image-card__overlay {
    display: flex;
    gap: 8px;
    opacity: 0;
    position: absolute;
    right: var(--space-3);
    top: var(--space-3);
    transition: opacity 120ms ease;
    z-index: 3;
  }

  .image-card:hover .image-card__overlay {
    opacity: 1;
  }

  .image-card:focus-within .image-card__overlay {
    opacity: 1;
  }

  .image-card__overlay--left {
    left: var(--space-3);
    right: auto;
  }

  .image-card__body {
    display: grid;
    gap: 6px;
    min-height: 112px;
    padding: var(--space-2) var(--space-4);
    position: relative;
    z-index: 2;
  }

  h3,
  p {
    margin: 0;
  }

  .image-card__title-row {
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: flex-start;
  }

  .image-card__title-row h3 {
    margin-top: 4px;
    font-size: 1rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .image-card__details,
  .image-card__meta {
    color: var(--color-text-muted);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.9rem;
    gap: 8px 12px;
  }

  .image-card__rename-trigger {
    flex: 0 0 auto;
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .image-card:hover .image-card__rename-trigger,
  .image-card:focus-within .image-card__rename-trigger {
    opacity: 1;
  }
</style>
