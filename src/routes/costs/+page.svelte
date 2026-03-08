<script lang="ts">
  import CostSummaryCards from '$lib/components/costs/CostSummaryCards.svelte';
  import CostTable from '$lib/components/costs/CostTable.svelte';

  export let data;
</script>

<div class="stack page-body--flush">
  <CostSummaryCards summary={data.summary} />
  <CostTable logs={data.logs} />
</div>
