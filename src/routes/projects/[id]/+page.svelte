<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import { toShortDate } from '$lib/utils/dates';

  export let data;
</script>

<div class="page-header">
  <h1>{data.project.name}</h1>
  <p>
    Projektkontext, Bilder und direkte Einstiege in Upload, Editor und Room Insert sind hier
    gebündelt.
  </p>
</div>

<div class="stack">
  <Card accent="blue">
    <div class="stack">
      <div class="muted">Projekt-ID</div>
      <strong>{data.project.id}</strong>
      {#if data.project.description}
        <div class="muted">{data.project.description}</div>
      {/if}
      <div class="muted">Zuletzt geändert: {toShortDate(data.project.updatedAt)}</div>
      <div class="cluster">
        <Button href="/projects">Zurück zur Liste</Button>

        {#if data.images[0]}
          <Button href={data.images[0].editUrl}>Letztes Bild im Editor</Button>
        {/if}
      </div>
    </div>
  </Card>

  <LibraryGrid
    items={data.images.map((image) => ({
      id: image.id,
      title: image.title,
      project: image.projectName,
      time: image.createdAt,
      status: image.type,
      thumbnailUrl: image.thumbnailUrl,
      downloadUrl: image.downloadUrl,
      editUrl: image.editUrl
    }))}
    loading={false}
  />
</div>
