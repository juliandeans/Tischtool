# Vorschlag für `AGENTS.md`

Lege diese Datei in die Projektwurzel, damit Codex sofort Projektregeln sieht.

```md
# AGENTS.md

## Projektziel

Baue eine minimalistische Möbel-Visualisierungs-Web-App mit SvelteKit und TypeScript.

Die App hat drei Kernmodi:
1. Umgebung eines Möbelbilds ändern
2. Material eines Möbelbilds ändern
3. Möbel in ein Kundenfoto einsetzen

## Wichtige Produktregeln

- Das Hauptobjekt ist schützenswert.
- Perspektive soll standardmäßig erhalten bleiben.
- Die Umgebung darf stärker verändert werden als das Möbel.
- Keine unnötigen Zusatzfeatures erfinden.
- Lieber stabiler MVP als überladene Architektur.

## Designregeln

- sehr minimalistisch
- leichte Border-Radius
- Buttons/Inputs/Icon-Buttons mit 2px Inset Shadow
- keine starken Drop Shadows
- Bauhaus-Farben als einzige Akzentfarben

## Technische Regeln

- SvelteKit + TypeScript
- saubere Komponentenstruktur
- klare Service-Schicht im Backend
- keine direkten API-Keys im Frontend
- keine destruktive Bearbeitung, immer Versionen

## Arbeitsweise

- ändere nur die Dateien, die für den jeweiligen Schritt nötig sind
- halte den Code modular
- vermeide unnötige Bibliotheken
- dokumentiere kurz nach jeder größeren Phase, was geändert wurde
- wenn etwas unklar ist, richte dich nach den Markdown-Dokumenten im Projekt
```

## Hinweis

Codex unterstützt projektbezogene Anleitung und Skills/Projektkontext. Eine klare Projektdatei wie `AGENTS.md` passt deshalb sehr gut in den Workflow. citeturn0search15turn0search20
