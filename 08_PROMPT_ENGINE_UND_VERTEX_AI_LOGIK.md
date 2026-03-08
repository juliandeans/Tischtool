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

## Stil-Presets

- Original
- ruhig / minimal
- wohnlich
- editorial
- hell / freundlich
- elegant / gedämpft

## Licht-Presets

- Original
- Tageslicht
- warmes Abendlicht
- gedimmtes Licht
- Kerzenlicht
- diffuses weiches Licht
