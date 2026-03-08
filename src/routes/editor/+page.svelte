<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<div class="page-header">
  <span class="eyebrow">Editor</span>
  <h1>Kein Bild für den Editor vorhanden</h1>
  <p>
    Der Editor braucht ein bestehendes Bild. Lade zuerst ein Bild hoch oder öffne eines aus der
    Library.
  </p>
</div>

<EmptyState
  title="Noch kein Bild auswählbar"
  description="Sobald Bilder in Projekten oder in der Library vorhanden sind, kannst du sie direkt im Editor öffnen."
  accent="blue"
>
  <Button slot="actions" href="/library" variant="primary">Zur Library</Button>
</EmptyState>
