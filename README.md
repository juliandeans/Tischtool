# Möbel-Visualisierung – Codex Build Pack

Dieses Paket ist dafür gedacht, die komplette App möglichst reibungsarm mit Codex aufzubauen.

Die Dokumentation ist nicht nur eine Produktbeschreibung, sondern eine **Implementierungsgrundlage**:
- klare Produktziele
- feste Architekturentscheidungen
- genaue UI-Struktur
- Datenmodell
- API- und Prompt-Logik
- Schritt-für-Schritt-Reihenfolge für die Umsetzung
- konkrete Prompts für Codex
- Abnahmekriterien pro Phase

## Ziel

Codex soll nicht in der Mitte anfangen zu improvisieren, sondern in einer klaren Reihenfolge arbeiten.

## Enthaltene Dateien

- `01_PRODUKTVISION_UND_SCOPE.md`
- `02_UX_UI_KONZEPT.md`
- `03_DESIGNSYSTEM.md`
- `04_INFORMATIONSARCHITEKTUR_UND_SCREENS.md`
- `05_FRONTEND_ARCHITEKTUR_SVELTEKIT.md`
- `06_BACKEND_ARCHITEKTUR.md`
- `07_DATENMODELL_UND_STORAGE.md`
- `08_PROMPT_ENGINE_UND_VERTEX_AI_LOGIK.md`
- `09_LIBRARY_VERSIONING_EXPORT_KOSTEN.md`
- `10_ROOM_INSERT_FEATURE.md`
- `11_MVP_ROADMAP.md`
- `12_IMPLEMENTATION_PLAN_FUER_CODEX.md`
- `13_CODEX_PROMPTS.md`
- `14_ACCEPTANCE_CRITERIA.md`
- `15_AGENTS_MD_VORSCHLAG.md`

## Warum dieses Paket so aufgebaut ist

Codex kann lokal im Terminal laufen, Code lesen, ändern und Befehle ausführen. Es ist für echte Engineering-Arbeit gedacht, inklusive Features, Refactors und Review-Schritten. Die IDE-Erweiterung und Codex CLI sind genau für solche projektbezogenen Workflows gedacht. Offizielle OpenAI-Dokumentation empfiehlt außerdem klare Projektführung, strukturierte Aufgaben und einen definierten Projektkontext statt vager Mega-Prompts. citeturn0search1turn0search4turn0search12turn0search5

## Wichtigster Arbeitsgrundsatz

Nicht “Bau alles auf einmal”, sondern:
1. Projektgerüst
2. Datenmodell
3. Storage + Upload
4. Library
5. Editor
6. Generierung
7. Room Insert
8. Kosten
9. Polishing

## Empfohlene Codex-Arbeitsweise

OpenAI beschreibt Codex als Agent, der in Projektordnern arbeiten kann, Dateien liest, ändert und Befehle ausführt. Codex unterstützt außerdem Skills/Projektanweisungen sowie lokale und cloudbasierte Workflows. Deshalb ist es sinnvoll, dem Projekt eine sehr klare schriftliche Arbeitsgrundlage mitzugeben. citeturn0search1turn0search10turn0search15
