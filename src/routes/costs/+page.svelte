<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CostSummaryCards from '$lib/components/costs/CostSummaryCards.svelte';
  import CostTable from '$lib/components/costs/CostTable.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  export let data;

  let filterForm: HTMLFormElement;

  const submitFilters = () => {
    filterForm?.requestSubmit();
  };
</script>

<div class="stack page-body--flush costs-page">
  <CostSummaryCards summary={data.summary} />
  <Card accent="yellow">
    <form bind:this={filterForm} class="costs-filters" method="GET">
      <Select
        id="costs-project"
        name="projectId"
        label="Projekt"
        value={data.filters.projectId}
        on:change={submitFilters}
        options={[
          { value: '', label: 'Alle Projekte' },
          ...data.projects
        ]}
      />
      <Input
        id="costs-start-date"
        name="startDate"
        type="date"
        label="Von"
        value={data.filters.startDate}
        on:change={submitFilters}
      />
      <Input
        id="costs-end-date"
        name="endDate"
        type="date"
        label="Bis"
        value={data.filters.endDate}
        on:change={submitFilters}
      />
      <div class="costs-filters__actions">
        <Button type="submit" variant="primary">Filter anwenden</Button>
        <Button href="/costs" variant="secondary">Zurücksetzen</Button>
      </div>
    </form>
  </Card>
  <CostTable logs={data.logs} />
</div>

<style>
  .costs-page {
    gap: var(--space-4);
    padding-top: var(--space-2);
  }

  .costs-filters {
    align-items: end;
    display: grid;
    gap: var(--space-3);
    grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(180px, 1fr)) auto;
  }

  .costs-filters__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  @media (max-width: 900px) {
    .costs-filters {
      grid-template-columns: 1fr;
    }
  }
</style>
