# Implementierungsplan für Codex

## Ziel dieses Dokuments

Codex soll die App in einer festen Reihenfolge bauen, ohne mitten im Projekt die Struktur umzuschmeißen.

## Grundregel

Codex soll pro Phase:
1. lesen
2. planen
3. die betroffenen Dateien ändern
4. wenn möglich lokal testen
5. kurz dokumentieren, was gebaut wurde

## Phase A – Projektgerüst

Codex soll:
- SvelteKit-Projekt initialisieren
- TypeScript aktivieren
- Basisstruktur anlegen
- globale Styles + Design Tokens anlegen
- AppShell mit Sidebar anlegen
- leere Seiten für alle Hauptrouten anlegen

Ergebnis:
Die App startet und alle Hauptseiten sind erreichbar.

## Phase B – Datenmodell und Backend-Skelett

Codex soll:
- DB-Schema anlegen
- Services als leere/teilweise implementierte Klassen oder Module anlegen
- API-Endpunkte als Skelett anlegen
- Storage-Abstraktion anlegen

Ergebnis:
Projekt, Bild, Generierung und Kosten sind als Datenmodell definiert.

## Phase C – Upload und Library

Codex soll:
- Bild-Upload implementieren
- Bilder speichern
- Thumbnails erzeugen
- Library-Grid bauen
- Download-Hover
- Edit-Hover

Ergebnis:
Bilder lassen sich hochladen, sehen und herunterladen.

## Phase D – Editor environment_edit

Codex soll:
- Editor-Screen bauen
- Sidebar-Felder implementieren
- Prompt Builder für environment_edit implementieren
- Generierungs-Flow vom Frontend bis Backend herstellen
- Ergebnisse als neue Bilder speichern

Ergebnis:
Aus einem Bild werden neue Umgebungsvarianten erzeugt.

## Phase E – material_edit

Codex soll:
- Materialmodus ergänzen
- Prompt-Builder erweitern
- UI-Modusumschaltung einbauen

Ergebnis:
Materialvarianten funktionieren.

## Phase F – room_insert

Codex soll:
- Raumfoto-Screen bauen
- RoomPlacementCanvas implementieren
- Klick + optionale Box erfassen
- Backend-Flow room_insert ergänzen
- Ergebnisse speichern

Ergebnis:
Möbel können grob in Kundenfotos gesetzt werden.

## Phase G – Kosten

Codex soll:
- Costs-Tabelle füllen
- Summary-Endpunkte bauen
- Kosten-Screen bauen

Ergebnis:
Kosten sind sichtbar.

## Arbeitsregel für Codex

Codex soll pro Phase nicht bereits die nächste halbe Phase erraten.
Erst sauber fertig bauen, dann weiter.
