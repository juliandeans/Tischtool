<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="placement-card">
  <Card padded={false}>
    <div class="placement">
      <div class="placement__room">
        <div class="placement__target"></div>
      </div>
      <div class="placement__legend">
        <span class="eyebrow">Canvas Placeholder</span>
        <p>Raumfoto, Klick-Erfassung und Zielbox werden bewusst erst in Phase 6 umgesetzt.</p>
      </div>
    </div>
  </Card>
</div>

<style>
  .placement-card {
    overflow: hidden;
  }

  .placement {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .placement__room {
    aspect-ratio: 16 / 10;
    background:
      linear-gradient(180deg, rgba(242, 197, 0, 0.08), rgba(0, 87, 184, 0.04)),
      var(--color-surface-muted);
    border: 1px dashed var(--color-border);
    border-radius: 20px;
    position: relative;
  }

  .placement__target {
    border: 2px solid var(--color-red);
    border-radius: 16px;
    height: 34%;
    left: 28%;
    position: absolute;
    top: 38%;
    width: 32%;
  }

  p {
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
