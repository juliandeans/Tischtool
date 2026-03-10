# Auth-Audit: Image Provider

Gepruefte Dateien:

- `src/lib/server/vertex/gemini-image.ts`
- `src/lib/server/openai/image.ts`
- `src/lib/server/services/GenerationService.ts`
- `src/lib/server/vertex/client.ts`
- `src/lib/server/config.ts`
- `.env`

Zusatzbefund:

- Eine Suche nach weiteren Auth-/Token-/Credential-Dateien in `src/lib/server` hat keine separate Datei wie `src/lib/server/vertex/auth.ts` gefunden. Die relevante Google-Auth-Logik liegt in `src/lib/server/vertex/client.ts`.

## Gemini

### Aktueller Auth-Mechanismus

Der HTTP-Call fuer Gemini wird in `src/lib/server/vertex/gemini-image.ts` gebaut. Dort werden genau diese Header gesetzt:

- `Authorization: Bearer <accessToken>` in Zeile 120
- `Content-Type: application/json` in Zeile 121

Der Bearer-Token wird nicht in `gemini-image.ts` selbst erzeugt, sondern in `src/lib/server/services/GenerationService.ts` vor dem Call geholt:

- `vertexClient.getAccessToken()` in Zeile 479
- Uebergabe an `callGeminiImageEdit(..., projectId, accessToken, geminiModelId)` in Zeilen 487-497

Die eigentliche Token-Beschaffung liegt in `src/lib/server/vertex/client.ts`:

- `GoogleAuth` aus `google-auth-library` in Zeile 1
- Scope: `https://www.googleapis.com/auth/cloud-platform` in Zeile 5
- Auth-Client mit `keyFilename: configuration.credentialsPath || undefined` in Zeilen 39-43
- Access Token ueber `client.getAccessToken()` in Zeilen 55-57

Damit ist der konkrete Mechanismus:

- OAuth2 Access Token fuer Google Cloud
- aus einem Service-Account-JSON, wenn `GOOGLE_APPLICATION_CREDENTIALS` gesetzt ist
- sonst Fallback auf ambient ADC

Im aktuellen Repo ist `GOOGLE_APPLICATION_CREDENTIALS` in `.env` gesetzt:

- `VERTEX_PROJECT_ID=tischtool`
- `VERTEX_LOCATION=us-central1`
- `VERTEX_MODEL=google/imagen-3.0-capability-001`
- `GOOGLE_APPLICATION_CREDENTIALS=/Users/juliansander/ITProjekte/tischtool-9c3e51a2d387.json`

Die referenzierte JSON-Datei ist vorhanden und enthaelt folgende nicht-sensitive Metadaten:

- `type=service_account`
- `project_id=tischtool`
- `client_email=tischtool@tischtool.iam.gserviceaccount.com`

Wichtig: Der aktuelle Gemini-Pfad verwendet damit nicht `gcloud`-User-Credentials und nicht Google AI Studio API Keys.

### Endpoint

Der Endpoint wird in `src/lib/server/vertex/gemini-image.ts` in Zeilen 20-24 gebaut:

- `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelId}:generateContent`

Die verwendeten Modell-IDs sind hart codiert:

- `gemini-3-pro-image-preview` in Zeile 17
- `gemini-3.1-flash-image-preview` in Zeile 18

`GenerationService` waehlt eines dieser Modelle in Zeilen 480-484 aus und schreibt denselben Endpoint in die Debug-Daten in Zeile 524.

Das ist klar Vertex AI:

- Host: `aiplatform.googleapis.com`
- Methode: `:generateContent`
- kein `generativelanguage.googleapis.com`
- kein Proxy

### Env-Variable(n)

Direkt oder indirekt relevant fuer Gemini:

- `VERTEX_PROJECT_ID`
- `VERTEX_LOCATION`
- `VERTEX_MODEL`
- `GOOGLE_APPLICATION_CREDENTIALS`

Tatsaechlich verwendet werden fuer den Gemini-HTTP-Call:

- `VERTEX_PROJECT_ID` ueber `getVertexRuntimeConfig()` -> `vertexClient.getConfiguration()` -> `projectId`
- `GOOGLE_APPLICATION_CREDENTIALS` ueber `getVertexRuntimeConfig()` -> `vertexClient.createAuthClient()` -> `keyFilename`

Wichtig:

- `VERTEX_LOCATION=us-central1` wird fuer den Gemini-Endpoint nicht verwendet; `gemini-image.ts` hartcodiert `locations/global`
- `VERTEX_MODEL=google/imagen-3.0-capability-001` wird fuer Gemini ebenfalls nicht verwendet; der Gemini-Pfad benutzt nur die Preview-Modelle aus `gemini-image.ts`

### Bewertung

Der aktuelle Gemini-Pfad ist bereits Vertex AI mit serverseitigem Service Account. Er laeuft nicht ueber Google AI Studio und nicht ueber einen Free-Tier-API-Key.

Die staerksten, direkt im Code belegbaren Punkte sind:

- Auth ist Google Cloud OAuth2 per Service Account JSON, nicht API Key
- Endpoint ist Vertex AI `aiplatform.googleapis.com`, nicht AI Studio `generativelanguage.googleapis.com`
- Der Service Account gehoert zum Projekt `tischtool`, also zum selben Projekt wie `VERTEX_PROJECT_ID`
- Der Gemini-Pfad ignoriert `VERTEX_MODEL` und benutzt stattdessen hart codierte Preview-Modelle
- Der Gemini-Pfad ignoriert `VERTEX_LOCATION` fuer die Request-URL und sendet immer an `locations/global`

Ausserdem gibt es keine serverseitige Retry-, Backoff- oder Queue-Logik fuer Gemini. Stattdessen werden mehrere Varianten parallel abgeschossen:

- `Promise.all(Array.from({ length: options.input.variantsRequested }, ...))` in Zeilen 485-500

Das ist keine eigene 429-Quelle, aber es kann Provider-Rate-Limits sehr leicht triggern.

Noch ein relevanter Nebenbefund aus `.env`:

- Unterhalb von `OPENAI_API_KEY` steht eine weitere alleinstehende, credential-aehnliche Zeile mit Prefix `AQ.` ohne `KEY=VALUE`.
- Im Code gibt es keinen Leser fuer eine solche Variable.
- Es gibt auch keinen Codepfad, der einen Gemini- oder Google-API-Key verwendet.
- Diese Zeile ist daher nach aktuellem Codepfad nicht Teil der Gemini-Authentifizierung.

### Wahrscheinliche Ursache des 429

Nach aktuellem Codepfad sind diese Ursachen am wahrscheinlichsten:

1. Der Request geht zwar an Vertex AI, aber auf ein hart codiertes Preview-Gemini-Image-Modell mit eigener Quota-/Zugangsregelung.
   Der bezahlte `VERTEX_MODEL`-Wert (`google/imagen-3.0-capability-001`) spielt fuer diesen Pfad keine Rolle.

2. Mehrere Varianten werden als mehrere parallele Einzelrequests geschickt.
   Bei `variantsRequested > 1` erzeugt `GenerationService` einen Burst statt eines serialisierten Ablaufs.

3. Das Projekt oder die verwendete Modellfreischaltung hat fuer genau diese Gemini-Preview-Modelle nicht die erwartete Vertex-Quota.
   Der Code spricht klar Vertex an, aber nicht Imagen und nicht einen frei konfigurierbaren Modellnamen.

Weniger wahrscheinlich ist nach dem Code:

- Versehentlich Google AI Studio statt Vertex zu nutzen
- Versehentlich einen Free-Tier-Gemini-API-Key zu nutzen
- Versehentlich gcloud-User-ADC statt Service-Account-Datei zu nutzen

## OpenAI

### Aktueller Auth-Mechanismus

Der OpenAI-Call wird in `src/lib/server/openai/image.ts` gebaut.

Der API-Key kommt aus:

- `$env/dynamic/private` in Zeile 2
- `env.OPENAI_API_KEY` in Zeile 23

Der Header ist:

- `Authorization: Bearer <OPENAI_API_KEY>` in Zeile 75

Es gibt keinen weiteren Token-Refresh, kein OAuth und keinen Proxy. Das ist der normale OpenAI-API-Key-Flow.

Im aktuellen `.env` ist `OPENAI_API_KEY` gesetzt und beginnt mit `sk-proj-`, also ein OpenAI Project API Key.

### Endpoint

Der Endpoint ist in `src/lib/server/openai/image.ts` Zeile 18 fest:

- `https://api.openai.com/v1/images/edits`

Das Modell ist in Zeile 17 fest:

- `gpt-image-1`

Der Request geht direkt an die OpenAI API:

- kein interner Proxy
- kein SvelteKit-Relay
- kein Azure-OpenAI-Endpoint

### Env-Variable(n)

- `OPENAI_API_KEY`

Weitere OpenAI-bezogene Env-Variablen werden im gefundenen Code nicht gelesen.

### Bewertung

OpenAI ist sauber und direkt verdrahtet:

- direkter Call an `api.openai.com`
- Bearer-Auth mit `OPENAI_API_KEY`
- kein indirekter Auth-Layer

Auch hier werden mehrere Varianten parallel per `Promise.all(...)` in `GenerationService.ts` Zeilen 606-616 geschickt. Das ist fuer OpenAI relevant fuer moegliche Rate Limits, aber nicht Teil eines Proxy- oder Token-Problems.

Ein kleiner Debug-Widerspruch existiert in `GenerationService.ts`:

- In der OpenAI-Debugstruktur steht `usedFlow: 'vertex'` in Zeile 635

Das aendert nichts am echten HTTP-Ziel. Der echte Call geht trotzdem direkt an OpenAI.

## Empfehlungen

Damit Gemini korrekt ueber Vertex AI mit dem bezahlten Service Account laeuft, sind aus dem aktuellen Befund vor allem diese Punkte wichtig:

1. Auth-seitig ist der Pfad bereits auf Vertex Service Account gestellt.
   `GOOGLE_APPLICATION_CREDENTIALS` zeigt auf ein Service-Account-JSON des Projekts `tischtool`, und `vertex/client.ts` benutzt genau diese Datei fuer `GoogleAuth`.

2. Die eigentliche Abweichung liegt nicht in der Auth, sondern in der Modellauswahl.
   Der Gemini-Pfad ignoriert `VERTEX_MODEL` und verwendet hart codiert `gemini-3-pro-image-preview` bzw. `gemini-3.1-flash-image-preview`.

3. Wenn der bezahlte Setup auf einem bestimmten Vertex-Modell oder auf regionaler Konfiguration basiert, muss der Gemini-Pfad dieselbe Konfiguration verwenden statt separater Preview-Modelle auf `locations/global`.

4. Wenn mehrere Varianten benoetigt werden, sollte fuer Gemini keine parallele Burst-Ausfuehrung verwendet werden.
   Der aktuelle `Promise.all(...)`-Pfad ist eine plausible direkte 429-Ursache.

5. Fuer die eigentliche Fehlerklaerung sollte die volle Google-Fehlerstruktur des 429 geloggt werden.
   Aktuell wird in `gemini-image.ts` nur `error.message` weitergereicht, nicht die gesamte Fehlerpayload mit Quota-Hinweisen.

Kurzfassung:

- Der Code nutzt fuer Gemini bereits Vertex AI und einen Service Account des Projekts `tischtool`.
- Der 429 wirkt nach diesem Befund nicht wie ein versehentlicher AI-Studio-Free-Tier-Call.
- Die naheliegendste technische Ursache ist, dass nicht das erwartete bezahlte Vertex-Modell verwendet wird, sondern ein hart codiertes Gemini-Preview-Modell, kombiniert mit parallelen Einzelrequests pro Variante.
