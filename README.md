# Möbel-Visualisierung – Codex Build Pack (Version 2)

Dieses Paket ist dafür gedacht, die komplette App mit GPT Codex möglichst geradlinig und ohne Architektur-Chaos aufzubauen.

Der Fokus liegt auf:
- klaren Produktgrenzen
- fester Tech-Entscheidung
- exakter Umsetzungsreihenfolge
- konkreten Datenstrukturen
- klaren API-Verträgen
- Komponenten-Checklisten
- Abnahmekriterien
- wenig Interpretationsspielraum für Codex

## Ziel

Codex soll mit wenigen, klar getrennten Prompts die App in Phasen bauen können, ohne unterwegs die Struktur umzuschmeißen oder unnötige Features zu erfinden.

## Enthaltene Dateien

### Produkt und UX
- `01_PRODUKTVISION_UND_SCOPE.md`
- `02_UX_UI_KONZEPT.md`
- `03_DESIGNSYSTEM.md`
- `04_INFORMATIONSARCHITEKTUR_UND_SCREENS.md`

### Architektur
- `05_FRONTEND_ARCHITEKTUR_SVELTEKIT.md`
- `06_BACKEND_ARCHITEKTUR.md`
- `07_DATENMODELL_UND_STORAGE.md`
- `08_PROMPT_ENGINE_UND_VERTEX_AI_LOGIK.md`
- `09_LIBRARY_VERSIONING_EXPORT_KOSTEN.md`
- `10_ROOM_INSERT_FEATURE.md`

### Umsetzung
- `11_MVP_ROADMAP.md`
- `12_IMPLEMENTATION_PLAN_FUER_CODEX.md`
- `13_CODEX_PROMPTS.md`
- `14_ACCEPTANCE_CRITERIA.md`
- `15_AGENTS_MD_VORSCHLAG.md`

### Neue technische Spezifikation für Codex
- `16_REPO_STRUCTURE.md`
- `17_DRIZZLE_SCHEMA_SPEC.md`
- `18_API_CONTRACTS.md`
- `19_COMPONENT_CHECKLIST.md`
- `20_TESTING_STRATEGY.md`
- `21_ENV_AND_SETUP.md`
- `22_DEFINITION_OF_DONE_PRO_PHASE.md`

## Wie dieses Paket verwendet werden soll

1. Neues Repo anlegen
2. Diese Dateien in das Repo legen
3. `AGENTS.md` in die Root legen
4. Codex nicht mit einem Mega-Prompt losschicken
5. Stattdessen strikt phasenweise arbeiten
6. Nach jeder Phase kurz prüfen, committen, dann erst weiter

## Empfohlene Reihenfolge

1. Setup und Repo-Struktur
2. DB-Schema und Services
3. Upload und Storage
4. Library
5. Editor `environment_edit`
6. Editor `material_edit`
7. `room_insert`
8. Kostenbereich
9. Tests, Fehlerzustände, Polishing

## Wichtige Regel

Lieber enger Scope und stabiler MVP als cleverer Pfusch mit 200 halben Features.
