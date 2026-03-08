<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import LibraryGrid from '$lib/components/library/LibraryGrid.svelte';
  import { toShortDate } from '$lib/utils/dates';

  export let data;
</script>

<div class="page-header">
  <span class="eyebrow">Projects</span>
  <h1>{data.project.name}</h1>
  <p>
    Projektkontext und zuletzt hochgeladene Bilder stehen hier direkt bereit. Der eigentliche
    Generierungsflow bleibt bewusst noch außen vor.
  </p>
</div>

<div class="stack">
  <Card accent="blue">
    <div class="stack">
      <div class="muted">Projekt-ID</div>
      <strong>{data.id}</strong>
      <div class="muted">Zuletzt geändert: {toShortDate(data.project.updatedAt)}</div>
      <div class="cluster">
        <a href="/projects">
          <Button>Zurück zur Liste</Button>
        </a>
        <a href="/library">
          <Button variant="primary">Zur Library</Button>
        </a>
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
  />
</div>
