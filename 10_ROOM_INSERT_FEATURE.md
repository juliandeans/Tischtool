# Feature-Spezifikation: Möbel in Kundenfoto einsetzen

## Ziel

Ein Raumfoto und ein Möbelbild werden zu einer plausiblen Demo kombiniert.

Es geht nicht um perfekte Maßhaltigkeit.
Es geht um schnelle, glaubwürdige Kundenvorschauen.

## UI-Flow

1. Raumfoto hochladen
2. Möbelbild hochladen
3. im Raumfoto klicken
4. optional Größe ziehen
5. Stil/Licht wählen
6. Varianten erzeugen

## Daten, die gespeichert werden

- Raumfoto-ID
- Möbelbild-ID
- x
- y
- width
- height
- Presets
- Variantenanzahl

## Ergebnis

Die KI erzeugt ein Bild, in dem das Möbel ungefähr an der gewünschten Stelle steht.

## Verhalten der KI

Erlaubt:
- leichte Perspektivanpassung
- leichte Schattenintegration
- leichte Lichtangleichung

Nicht erlaubt:
- Möbel neu entwerfen
- neue große Zusatzmöbel erzeugen
- Raum komplett uminterpretieren

## Technischer Flow

Frontend:
- Canvas erfasst Zielregion

Backend:
- RoomPlacementService bereitet Insert-Request vor
- optional einfache Maske / Zielregion
- Vertex-AI-Aufruf

## Warum eigener Reiter sinnvoll ist

Der Workflow ist anders als beim normalen Editor.
Er braucht zwei Bildquellen und eine visuelle Platzierung.
Darum sollte er als eigener Reiter / eigener Screen existieren.
