<script lang="ts">
  import RoomPlacementCanvas from '$lib/components/room-insert/RoomPlacementCanvas.svelte';
  import RoomInsertSidebar from '$lib/components/room-insert/RoomInsertSidebar.svelte';
</script>

<div class="page-header">
  <span class="eyebrow">Room Insert</span>
  <h1>Möbel in Raumfoto platzieren</h1>
  <p>
    Zentrale Platzierungsfläche und rechte Steuerung sind bereits sichtbar. Klickerfassung,
    Zielbox-Logik und Backend-Flow bleiben bewusst noch aus.
  </p>
</div>

<div class="split-layout">
  <RoomPlacementCanvas />
  <RoomInsertSidebar />
</div>
