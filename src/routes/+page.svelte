<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="stack">
  <Card accent="yellow">
    <div class="stack">
      <p class="muted">
        Beginne mit einem Projekt, lade ein Bild hoch und arbeite dich dann über Library und Editor
        oder Room Insert weiter.
      </p>
      <div class="cluster">
        <Button href="/projects" variant="primary">Zu Projekten</Button>
        <Button href="/library">Zur Bibliothek</Button>
      </div>
    </div>
  </Card>
</div>
