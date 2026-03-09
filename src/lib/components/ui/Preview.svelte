<script lang="ts">
  export let open = false;
  export let src = '';
  export let alt = '';

  const close = () => {
    open = false;
  };
</script>

{#if open && src}
  <div
    class="preview"
    aria-label="Bildvorschau"
    role="dialog"
    tabindex="0"
    on:click={close}
    on:keydown={(event) => {
      if (event.key === 'Escape') {
        close();
      }
    }}
  >
    <button class="preview__frame" type="button" aria-label="Vorschau geöffnet" on:click|stopPropagation>
      <img class="preview__image" {src} {alt} />
    </button>
  </div>
{/if}

<style>
  .preview {
    align-items: center;
    background: transparent;
    display: flex;
    inset: 0;
    justify-content: center;
    padding: var(--space-4);
    position: fixed;
    z-index: 200;
  }

  .preview__image {
    border: 1px solid rgba(255, 255, 255, 0.85);
    display: block;
    max-height: calc(100vh - (var(--space-4) * 2));
    max-width: calc(100vw - (var(--space-4) * 2));
    object-fit: contain;
  }

  .preview__frame {
    background: transparent;
    border: 0;
    padding: 0;
  }
</style>
