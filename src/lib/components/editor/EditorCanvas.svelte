<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';

  export let imageId = '';
</script>

<div class="canvas-card">
  <Card padded={false}>
    <div class="canvas">
      <div class="canvas__frame">
        <div class="canvas__label">Image ID</div>
        <strong>{imageId}</strong>
        <p>
          Die große Bildansicht wird in späteren Phasen mit echten Bilddaten und Varianten
          verbunden.
        </p>
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
    background:
      linear-gradient(135deg, rgba(0, 87, 184, 0.05), rgba(242, 197, 0, 0.12)),
      var(--color-surface-muted);
    display: grid;
    min-height: 520px;
    padding: var(--space-4);
    place-items: center;
  }

  .canvas__frame {
    background: rgba(255, 255, 255, 0.86);
    border: 1px dashed var(--color-border);
    border-radius: 20px;
    display: grid;
    gap: var(--space-2);
    max-width: 420px;
    padding: var(--space-4);
    text-align: center;
  }

  .canvas__label {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  strong,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
  }
</style>
