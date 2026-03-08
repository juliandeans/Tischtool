# ENV und Setup

## Ziel

Codex soll die App so aufsetzen, dass sie lokal direkt startbar ist.

## .env.example

```env
DATABASE_URL=
STORAGE_DRIVER=local
STORAGE_BASE_PATH=./data
VERTEX_PROJECT_ID=
VERTEX_LOCATION=
VERTEX_MODEL=
GOOGLE_APPLICATION_CREDENTIALS=
PUBLIC_APP_NAME=Moebel Visualisierung
```

## Setup-Entscheidungen für MVP

- PostgreSQL lokal oder per Docker
- lokaler Storage im Dev-Modus erlaubt
- S3-kompatibler Storage später leicht austauschbar
- Vertex-Creds nur im Backend

## Dev-Mode Vereinfachung

Im Dev-Modus darf Storage lokal auf Dateisystem laufen.
So kann Codex Upload/Download/Thumbnails ohne Cloud-Zirkus bauen.

## Initiale Seed-Daten

Es ist sinnvoll, 2–3 Default-Presets zu seeden:

### Stil
- Original
- editorial
- wohnlich

### Licht
- Original
- Tageslicht
- Abendlicht

## NPM Scripts – Soll

- `dev`
- `build`
- `preview`
- `check`
- `lint`
- `test`
- `db:generate`
- `db:migrate`
- `db:studio`
