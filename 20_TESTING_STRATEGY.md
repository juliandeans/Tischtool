# Testing Strategy

## Ziel

Codex soll nicht nur UI-Dateien hinstellen, sondern einen testbaren MVP bauen.

## Für MVP ausreichend

- Unit Tests für Prompt Builder
- Unit Tests für Kostenberechnung
- einfache Service-Tests für Datenmapping
- UI-Smoke-Tests für Hauptrouten optional
- keine übertriebene Testarchitektur

## Zu testen

### Prompt Builder
- environment_edit baut erwartete Prompt-Fragmente
- material_edit baut erwartete Prompt-Fragmente
- room_insert enthält Zielregion-Hinweis

### Cost Service
- Summen stimmen
- Durchschnitt pro Bild stimmt
- keine Division durch Null

### API Validation
- fehlende Pflichtfelder führen zu 400
- ungültiger mode wird abgelehnt

### RoomPlacementCanvas
- Klick setzt Koordinaten
- Drag setzt Breite/Höhe
- Reset leert Auswahl

## Test-Werkzeuge

Empfehlung:
- Vitest
- Testing Library für Svelte-Komponenten
- Playwright nur später, wenn nötig

## Wichtige Regel

Nicht zuerst E2E-Zirkus bauen.
Erst die Kernlogik absichern.
