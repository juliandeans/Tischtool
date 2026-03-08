# Informationsarchitektur und Screens

## Hauptrouten

- `/projects`
- `/projects/[id]`
- `/library`
- `/editor/[imageId]`
- `/room-insert`
- `/presets`
- `/costs`
- `/settings`

## Screens

### Projekte

Projektliste mit Cover, letzter Bearbeitung und Bildanzahl.

### Projekt-Detail

Originalbild, letzte Varianten, Schnellaktionen.

### Library

Grid aller Bilder.

### Editor

Einzelbild mit rechter Sidebar.

### Raumfoto einsetzen

Eigenständiger Modus mit Platzierungs-Canvas.

### Kosten

Zusammenfassung, Tabelle, Diagramme.

## Screen: Library

Grid aus Bildkarten.

Pro Karte:

- Bild
- Metadaten
- Hover-Icons:
  - Download
  - Edit

## Screen: Editor

Linke/zentral:

- großes Vorschaubild

Rechte Sidebar:

- Modus
- Stil
- Licht
- Varianten
- zusätzliche Hinweise
- Generieren

## Screen: Raumfoto einsetzen

Zentrale Fläche:

- Raumfoto
- Platzierungs-Overlay / Box

Rechte Sidebar:

- Möbelbild auswählen
- Stil
- Licht
- Varianten
- Generate

## Screen: Kosten

Oben:

- Kosten heute
- Kosten im Monat
- Durchschnitt pro Bild
- teuerstes Projekt

Darunter:

- Tabelle
- Kosten pro Projekt
- Kosten pro Tag

## Leere Zustände

Die App braucht gute Empty States:

- kein Projekt
- keine Bilder
- keine Kosten
- kein Raumfoto gewählt
