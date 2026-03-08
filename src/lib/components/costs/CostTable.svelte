<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<Card padded={false}>
  <div class="table-shell">
    <div class="table-head">
      <span>Datum</span>
      <span>Projekt</span>
      <span>Modell</span>
      <span>Kosten</span>
    </div>
    <div class="table-body">
      <EmptyState
        title="Noch keine Kostendaten"
        description="Summary-Endpunkte und die echte Kostentabelle werden erst in Phase 7 umgesetzt."
        accent="red"
      />
    </div>
  </div>
</Card>

<style>
  .table-shell {
    overflow: hidden;
  }

  .table-head {
    color: var(--color-text-muted);
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: var(--space-3) var(--space-4);
  }

  .table-body {
    border-top: 1px solid var(--color-border);
    padding: var(--space-3);
  }

  @media (max-width: 720px) {
    .table-head {
      display: none;
    }
  }
</style>
