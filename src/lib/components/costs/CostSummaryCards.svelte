<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';

  const items = [
    { label: 'Heute', value: '—', accent: 'blue' },
    { label: 'Monat', value: '—', accent: 'yellow' },
    { label: 'Durchschnitt', value: '—', accent: 'red' },
    { label: 'Teuerstes Projekt', value: '—', accent: 'blue' }
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
    font-size: 2rem;
    margin-top: 10px;
  }
</style>
