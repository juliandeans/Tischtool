<script lang="ts">
  import CostSummaryCards from '$lib/components/costs/CostSummaryCards.svelte';
  import CostTable from '$lib/components/costs/CostTable.svelte';

  export let data;
</script>

<div class="page-header">
  <span class="eyebrow">Costs</span>
  <h1>Kostenübersicht</h1>
  <p>
    Der Costs-Bereich zeigt nachvollziehbare Dev- und Schätzwerte aus den bestehenden
    Generierungsflows.
  </p>
</div>

<div class="stack">
  <CostSummaryCards summary={data.summary} />
  <CostTable logs={data.logs} />
</div>
