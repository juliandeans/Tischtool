# Frontend-Architektur mit SvelteKit

## Stack

- SvelteKit
- TypeScript
- CSS-Token oder Tailwind mit eigener Designschicht
- Svelte Stores
- Canvas oder Konva für Platzierungsmodus

## Empfohlene Struktur

```text
src/
  lib/
    components/
      layout/
      projects/
      library/
      editor/
      room-insert/
      presets/
      costs/
      ui/
    stores/
    types/
    utils/
    server/
      db/
      storage/
      services/
      prompt-builder/
      vertex/
  routes/
    +layout.svelte
    +page.svelte
    projects/
      +page.svelte
      [id]/
        +page.svelte
    library/
      +page.svelte
    editor/
      [imageId]/
        +page.svelte
    room-insert/
      +page.svelte
    presets/
      +page.svelte
    costs/
      +page.svelte
    settings/
      +page.svelte
    api/
      projects/
      images/
      uploads/
      generations/
      costs/
      presets/
```

## Wichtige Komponenten

- `AppShell.svelte`
- `ProjectCard.svelte`
- `ImageCard.svelte`
- `LibraryGrid.svelte`
- `EditorCanvas.svelte`
- `EditorSidebar.svelte`
- `PresetSelect.svelte`
- `RoomPlacementCanvas.svelte`
- `CostSummaryCards.svelte`
- `CostTable.svelte`

## RoomPlacementCanvas

Funktionen:

- Raumfoto laden
- Klick erfassen
- optional Box ziehen
- visuelle Zielregion anzeigen
- Daten als `x`, `y`, `width`, `height` bereitstellen

## State-Aufteilung

Lokaler UI-State:

- Auswahlfelder
- Hover-Zustände
- aktive Presets
- modale Fenster

Server-State:

- Projekte
- Bilder
- Generierungen
- Kosten
- Presets

## API-Nutzung im Frontend

Das Frontend spricht nie direkt mit Google.
Nur mit dem eigenen Backend.
