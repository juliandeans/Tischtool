# Component Checklist

## Ziel

Codex soll jede Komponente bewusst bauen, statt nebenbei improvisierte UI-Fragmente zu verteilen.

## Layout

### AppShell.svelte
- Sidebar
- Content Slot
- konsistente Page Padding

### Sidebar.svelte
- Navigation Links
- aktiver Zustand
- konsistente Icons optional

## UI-Komponenten

### Button.svelte
- Varianten: primary, secondary, danger
- Inset Shadow
- disabled state
- loading state optional

### IconButton.svelte
- für Download/Edit
- kompakte Größe
- Tooltip-Slot optional

### Card.svelte
- Border
- Radius
- kein Drop Shadow

### Input.svelte
- Label
- Description optional
- Error-State
- Inset Shadow

### Select.svelte
- Label
- Options
- Inset Shadow

### EmptyState.svelte
- Titel
- Beschreibung
- CTA optional

## Projekte

### ProjectCard.svelte
- Titel
- Meta
- Cover
- klickbar

## Library

### ImageCard.svelte
- Thumbnail
- Meta
- Hover-Overlay
- Download Icon
- Edit Icon

### LibraryGrid.svelte
- responsives Grid
- Empty State
- Loading State

## Editor

### EditorCanvas.svelte
- Bildanzeige
- Zoom optional nur später
- sauber zentriert

### EditorSidebar.svelte
- Modus-Auswahl
- Stil-Preset
- Licht-Preset
- Variantenanzahl
- Zusatzhinweise
- Generate Button

### ModeTabs.svelte
- environment_edit
- material_edit

## Room Insert

### RoomPlacementCanvas.svelte
- Raumfoto anzeigen
- Klick speichern
- Drag für Box
- Zielbox rendern
- Reset möglich

### RoomInsertSidebar.svelte
- Möbelbildauswahl
- Stil
- Licht
- Varianten
- Generate

## Costs

### CostSummaryCards.svelte
- heute
- Monat
- Durchschnitt
- teuerstes Projekt

### CostTable.svelte
- Datum
- Projekt
- Modell
- Kosten
