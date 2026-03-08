<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { CostLogListItem } from '$lib/types/cost';

  export let logs: CostLogListItem[] = [];

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
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
      {#if logs.length === 0}
        <EmptyState
          title="Noch keine Kostendaten"
          description="Sobald Generierungen laufen, erscheinen hier nachvollziehbare Dev- oder Schätzkosten."
          accent="red"
        />
      {:else}
        <div class="rows">
          {#each logs as log}
            <div class="row">
              <span>{formatDate(log.createdAt)}</span>
              <span>{log.projectName}</span>
              <span>{log.model}</span>
              <strong>{formatCurrency(log.totalPrice)}</strong>
            </div>
          {/each}
        </div>
      {/if}
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

  .rows {
    display: grid;
  }

  .row {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 14px var(--space-2);
  }

  .row + .row {
    border-top: 1px solid var(--color-border);
  }

  strong {
    font-size: 1rem;
  }

  @media (max-width: 720px) {
    .table-head {
      display: none;
    }

    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
