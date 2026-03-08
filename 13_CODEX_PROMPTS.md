# Codex-Prompts

## Prompt 1 – Projektgerüst

Baue die erste lauffähige Version der App als SvelteKit-Projekt mit TypeScript. Lege die komplette Grundstruktur für die Routen `/projects`, `/library`, `/editor/[imageId]`, `/room-insert`, `/costs`, `/settings` an. Erstelle eine minimale AppShell mit linker Sidebar und Platzhaltern für alle Seiten. Verwende das Designsystem aus `03_DESIGNSYSTEM.md`. Nutze keine unnötigen Bibliotheken. Halte die Struktur sauber und modular. Schreibe am Ende kurz, welche Dateien du angelegt hast und was noch Platzhalter ist.

## Prompt 2 – Datenmodell und Backend-Skelett

Lies die Dateien `06_BACKEND_ARCHITEKTUR.md`, `07_DATENMODELL_UND_STORAGE.md`, `16_REPO_STRUCTURE.md` und `17_DRIZZLE_SCHEMA_SPEC.md` und implementiere daraus das Backend-Skelett. Erstelle das Datenbankschema, die Service-Module `ProjectService`, `ImageService`, `GenerationService`, `PromptBuilder`, `VertexImageService`, `RoomPlacementService`, `CostService` sowie die ersten API-Routen. Noch keine vollständige Business-Logik erfinden, sondern belastbare Grundstruktur. Dokumentiere zum Schluss kurz die Architekturentscheidungen.

## Prompt 3 – Upload und Library

Implementiere Upload, Thumbnail-Erzeugung, Bildspeicherung und den kompletten Library-Screen. Baue `ImageCard.svelte` mit Hover-Icons für Download und Edit. Nutze die Designregeln aus dem Designsystem. Die Library soll Bilder aus der DB laden und als Grid darstellen. Download darf zunächst über einen einfachen Backend-Endpoint laufen.

## Prompt 4 – Editor environment_edit

Baue den normalen Editor für `environment_edit`. Implementiere `EditorSidebar.svelte`, Preset-Auswahl, Variantenanzahl, Zusatzhinweise und den kompletten Frontend-zu-Backend-Flow für Generierungen. Nutze die Prompt-Logik aus `08_PROMPT_ENGINE_UND_VERTEX_AI_LOGIK.md` und die API-Verträge aus `18_API_CONTRACTS.md`. Speichere generierte Bilder als neue Versionen mit Parent-Beziehung.

## Prompt 5 – Materialmodus

Erweitere den Editor um `material_edit`. Ergänze die UI-Modusumschaltung, die Prompt-Engine und die Speicherung der Generierungen. Halte den Code konsistent mit dem bestehenden Editor und dupliziere möglichst wenig Logik.

## Prompt 6 – Raumfoto einsetzen

Baue den Screen `/room-insert` vollständig. Implementiere `RoomPlacementCanvas.svelte`, sodass ein Raumfoto geladen werden kann, eine Klickposition gespeichert wird und optional eine grobe Größe per Ziehen festgelegt wird. Verbinde das mit dem Backend-Flow `room_insert`. Speichere die Platzierungskoordinaten im Datenmodell. Ziel ist eine funktionierende Grundversion für Demo-Bilder.

## Prompt 7 – Kostenbereich

Implementiere den `costs`-Bereich vollständig. Zeige Summary Cards und eine Tabelle aller Generierungen mit Modell, Datum und Kosten. Nutze bestehende Datenmodelle. Wenn echte API-Kosten noch nicht vorliegen, implementiere zunächst nachvollziehbare Schätzwerte und kennzeichne sie sauber.

## Prompt 8 – Stabilisierung

Gehe jetzt die gesamte App systematisch durch. Suche nach Inkonsistenzen, toten Pfaden, doppelter Logik, schwachen Typen, fehlenden Ladezuständen und unstimmigem UI. Verbessere die Codebasis, ohne Architektur und Scope unnötig zu erweitern. Ergänze nur das, was für einen stabilen MVP nötig ist.
