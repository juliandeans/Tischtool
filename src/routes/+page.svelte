<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="stack">
  <div class="page-header">
    <span class="eyebrow">Start</span>
    <h1>Phase 1 steht als lauffähiges Grundgerüst.</h1>
    <p>
      Die AppShell, die Hauptrouten und die Basis-Komponenten sind vorhanden. Inhaltliche Logik für
      Upload, Generierung, Kosten und Datenhaltung bleibt bewusst noch aus.
    </p>
  </div>

  <Card accent="yellow">
    <div class="stack">
      <p class="muted">
        Beginne mit den Hauptrouten links in der Sidebar oder springe direkt zur Projektübersicht.
      </p>
      <div class="cluster">
        <a href="/projects">
          <Button variant="primary">Zu Projects</Button>
        </a>
        <a href="/library">
          <Button>Zur Library</Button>
        </a>
      </div>
    </div>
  </Card>
</div>
