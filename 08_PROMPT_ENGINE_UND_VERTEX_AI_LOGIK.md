# Prompt Engine und Vertex-AI-Logik

## Prinzip

Keine zweite KI zum Prompt-Umschreiben.
Stattdessen feste Templates.

## Prompt-Bausteine

1. fester Systemblock
2. Modus
3. Schutzregeln
4. Stil-Preset
5. Licht-Preset
6. Nutzereingaben
7. Ausgabeziel

## Fester Systemblock

Immer enthalten:
- Hauptobjekt erhalten
- Perspektive erhalten
- Maßstab und Konstruktion erhalten
- primär Umgebung ändern
- keine zusätzlichen Möbel ohne Anweisung

## Beispiel Modus: environment_edit

```text
Du bearbeitest ein Möbel-Visualisierungsbild für eine Kundenpräsentation.
Das Hauptobjekt muss in Perspektive, Kamerawinkel, Maßstab, Proportionen und Konstruktion erhalten bleiben.
Verändere primär die Umgebung.
Füge keine zusätzlichen Möbel hinzu.
```

## Beispiel Modus: material_edit

```text
Ändere ausschließlich das Material des Möbels.
Behalte Form, Konstruktion, Perspektive, Hintergrund und Licht möglichst unverändert.
```

## Beispiel Modus: room_insert

```text
Setze das Möbel plausibel in das Raumfoto ein.
Die Position befindet sich in der markierten Zielregion.
Das Möbel soll Form, Proportion und Konstruktion behalten.
Passe Licht und Schatten so an, dass das Ergebnis wie eine glaubwürdige Kundenvisualisierung wirkt.
Füge keine weiteren Möbel hinzu.
```

## Presets

### Stil
- Original
- ruhig / minimal
- wohnlich
- editorial
- hell / freundlich
- elegant / gedämpft

### Licht
- Original
- Tageslicht
- warmes Abendlicht
- gedimmtes Licht
- Kerzenlicht
- diffuses weiches Licht

## Vertex-AI-Rolle

Google Vertex AI dokumentiert Bildbearbeitung, Objekt-Einfügen und maskenbasierte Workflows über die Bild-APIs. Für den präziseren Edit-/Insert-Fall ist diese Architektur passend, während freiere Bildbearbeitung ebenfalls darüber laufen kann. Das passt gut zu einem Tool, das kontrollierte Möbel-Visualisierungen erzeugen soll. citeturn0search0

## Wichtige Regel

Für den MVP immer lieber zu kontrolliert als zu kreativ.
