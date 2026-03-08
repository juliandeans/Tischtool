# Repo-Struktur

## Ziel

Codex soll nicht selbst die Projektstruktur erfinden. Diese Struktur ist der Soll-Zustand.

## Root

```text
/
  .env.example
  .gitignore
  package.json
  svelte.config.js
  tsconfig.json
  vite.config.ts
  drizzle.config.ts
  README.md
  AGENTS.md
  docs/
  static/
  src/
```

## docs/

Hier liegen alle Markdown-Spezifikationen aus diesem Paket.

## static/

- statische Platzhaltergrafiken
- Logos
- Favicon

## src/

```text
src/
  app.html
  app.d.ts
  lib/
    components/
      layout/
        AppShell.svelte
        Sidebar.svelte
        Topbar.svelte
      ui/
        Button.svelte
        IconButton.svelte
        Card.svelte
        Input.svelte
        Select.svelte
        EmptyState.svelte
        Spinner.svelte
      projects/
        ProjectCard.svelte
        ProjectGrid.svelte
      library/
        ImageCard.svelte
        LibraryGrid.svelte
      editor/
        EditorCanvas.svelte
        EditorSidebar.svelte
        ModeTabs.svelte
      room-insert/
        RoomPlacementCanvas.svelte
        RoomInsertSidebar.svelte
      costs/
        CostSummaryCards.svelte
        CostTable.svelte
      presets/
        PresetSelect.svelte
    stores/
      ui.ts
      editor.ts
      roomInsert.ts
    types/
      project.ts
      image.ts
      generation.ts
      preset.ts
      cost.ts
      api.ts
    utils/
      format.ts
      dates.ts
      image.ts
      validation.ts
    server/
      db/
        index.ts
        schema.ts
      storage/
        index.ts
      prompt-builder/
        index.ts
        modes/
          environmentEdit.ts
          materialEdit.ts
          roomInsert.ts
      services/
        ProjectService.ts
        ImageService.ts
        GenerationService.ts
        CostService.ts
        RoomPlacementService.ts
      vertex/
        client.ts
        image.ts
        cost-estimation.ts
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
    costs/
      +page.svelte
    presets/
      +page.svelte
    settings/
      +page.svelte
    api/
      projects/
        +server.ts
        [id]/
          +server.ts
      uploads/
        +server.ts
      images/
        [id]/
          +server.ts
        [id]/download/
          +server.ts
      generations/
        +server.ts
      costs/
        summary/
          +server.ts
        logs/
          +server.ts
      presets/
        +server.ts
```

## Harte Regel

Codex soll keine parallelen Architekturwelten bauen. Keine zweite Backend-App, kein separates Frontend-Projekt.
