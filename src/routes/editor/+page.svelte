<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<EmptyState
  title="Noch kein Bild auswählbar"
  description="Sobald Bilder in Projekten oder in der Bibliothek vorhanden sind, kannst du sie direkt im Editor öffnen."
  accent="blue"
>
  <Button slot="actions" href="/library" variant="primary">Zur Bildbibliothek</Button>
</EmptyState>
