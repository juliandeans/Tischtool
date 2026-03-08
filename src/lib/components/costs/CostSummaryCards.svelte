<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import type { CostSummary } from '$lib/types/cost';

  export let summary: CostSummary;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);

  $: items = [
    { label: 'Heute', value: formatCurrency(summary.today), accent: 'blue' },
    { label: 'Monat', value: formatCurrency(summary.month), accent: 'yellow' },
    { label: 'Durchschnitt', value: formatCurrency(summary.averagePerImage), accent: 'red' },
    {
      label: 'Teuerstes Projekt',
      value: summary.mostExpensiveProject.name
        ? `${summary.mostExpensiveProject.name} · ${formatCurrency(summary.mostExpensiveProject.total)}`
        : '—',
      accent: 'blue'
    }
  ] as const;
</script>

<div class="summary-grid">
  {#each items as item}
    <Card accent={item.accent}>
      <div class="eyebrow">{item.label}</div>
      <strong>{item.value}</strong>
    </Card>
  {/each}
</div>

<style>
  .summary-grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  strong {
    display: block;
    font-size: 1.6rem;
    line-height: 1.2;
    margin-top: 10px;
  }
</style>
