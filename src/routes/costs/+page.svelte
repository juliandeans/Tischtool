<script lang="ts">
  import CostSummaryCards from '$lib/components/costs/CostSummaryCards.svelte';
  import CostTable from '$lib/components/costs/CostTable.svelte';
</script>

<div class="page-header">
  <span class="eyebrow">Costs</span>
  <h1>Kostenübersicht</h1>
  <p>
    Die Summary-Karten und die Tabellenschale sind vorbereitet. Echte Kostenwerte, Endpunkte und
    Berechnungen kommen erst in Phase 7.
  </p>
</div>

<div class="stack">
  <CostSummaryCards />
  <CostTable />
</div>
