# Backend-Architektur

## Grundsatz

Das Backend ist der geschützte Vermittler zwischen UI und Bildmodell.

Das Backend übernimmt:
- Upload
- Prompt-Erzeugung
- API-Aufruf
- Ergebnis-Speicherung
- Kostenlogging
- Projekt-/Version-Verwaltung

## Laufzeitmodell

Empfohlen:
SvelteKit Server-Routes + Service-Schicht.

## Services

- `ProjectService`
- `ImageService`
- `GenerationService`
- `PromptBuilder`
- `VertexImageService`
- `RoomPlacementService`
- `CostService`

## ProjectService
- Projekt anlegen
- Projekt lesen
- Projekt aktualisieren

## ImageService
- Upload speichern
- Metadaten speichern
- Thumbnails erzeugen
- Download vorbereiten

## GenerationService
- Generierungsauftrag entgegennehmen
- Provider ansteuern
- Varianten speichern
- Parent-Child-Ketten pflegen

## PromptBuilder
- UI-Werte in feste Prompt-Fragmente übersetzen
- Standardregeln einfügen
- Modus-spezifischen Prompt erzeugen

## VertexImageService
- Bild-API-Request aufbauen
- Antwort parsen
- Usage-Daten auslesen
- Fehlermeldungen vereinheitlichen

## RoomPlacementService
- Raumfoto + Möbelbild kombinieren
- Klickkoordinaten verarbeiten
- Zielregion / einfache Maske vorbereiten
- Vertex Edit/Insert auslösen

## Job-Modell

Für MVP möglich:
- synchroner Request mit Ladezustand

Später:
- Job-Tabelle + Queue

## Endpunkte

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `POST /api/uploads`
- `GET /api/images/:id`
- `GET /api/projects/:id/images`
- `POST /api/generations`
- `POST /api/images/:id/regenerate`
- `GET /api/costs/summary`
- `GET /api/costs/logs`
- `GET /api/presets`
