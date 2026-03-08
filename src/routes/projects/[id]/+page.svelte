<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  export let data;
</script>

<div class="page-header">
  <span class="eyebrow">Projects</span>
  <h1>Projektdetail als Platzhalter</h1>
  <p>
    Diese Detailroute ist angelegt, damit die Zielstruktur vollständig anschlussfähig bleibt. Echte
    Projekt- und Bilddaten folgen später.
  </p>
</div>

<Card accent="blue">
  <div class="stack">
    <div class="muted">Projekt-ID aus der Route</div>
    <strong>{data.id}</strong>
    <div class="cluster">
      <a href="/projects">
        <Button>Zurück zur Liste</Button>
      </a>
      <a href={`/editor/${data.id}`}>
        <Button variant="primary">Zum Editor</Button>
      </a>
    </div>
  </div>
</Card>
