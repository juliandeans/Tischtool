<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="stack">
  <div class="page-header">
    <span class="eyebrow">Start</span>
    <h1>Der MVP ist als zusammenhängender Produktfluss benutzbar.</h1>
    <p>
      Projekte, Upload, Library, Editor, Room Insert und Costs greifen jetzt zusammen. Nutze die
      Sidebar oder starte direkt mit einem Projekt.
    </p>
  </div>

  <Card accent="yellow">
    <div class="stack">
      <p class="muted">
        Beginne mit einem Projekt, lade ein Bild hoch und arbeite dich dann über Library und Editor
        oder Room Insert weiter.
      </p>
      <div class="cluster">
        <Button href="/projects" variant="primary">Zu Projects</Button>
        <Button href="/library">Zur Library</Button>
      </div>
    </div>
  </Card>
</div>
