<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import type { PromptDebugPreview } from '$lib/types/generation';

  export let title = 'Prompt-Vorschau';
  export let preview: PromptDebugPreview | null = null;
  export let loading = false;
  export let error = '';
  export let emptyMessage =
    'Sobald die Eingaben vollständig sind, erscheint hier die Prompt-Vorschau.';
  export let accent: 'none' | 'blue' | 'yellow' | 'red' = 'blue';
  export let open = false;

  const formatBase64Summary = (
    value:
      | {
          length: number | null;
          prefix: string | null;
          suffix: string | null;
          hasDataUrlPrefix: boolean;
        }
      | null
      | undefined
  ) => {
    if (!value || value.length === null) {
      return 'keine Angabe';
    }

    return `${value.length} Zeichen · ${value.prefix ?? '—'} … ${value.suffix ?? '—'}${
      value.hasDataUrlPrefix ? ' · data:-Prefix erkannt' : ''
    }`;
  };
</script>

<Card {accent} padded={false}>
  <details bind:open class="prompt-debug">
    <summary class="prompt-debug__summary">
      <span class="prompt-debug__summary-copy">
        <strong>{title}</strong>
        <small>
          {#if preview}
            {preview.modeLabel}
          {:else if loading}
            Vorschau wird aktualisiert
          {:else}
            Noch keine Vorschau
          {/if}
        </small>
      </span>
      <span class="prompt-debug__indicator" aria-hidden="true"></span>
    </summary>

    <div class="prompt-debug__body">
      {#if error}
        <p class="prompt-debug__error">{error}</p>
      {:else if loading}
        <p class="muted">Prompt-Vorschau wird aktualisiert…</p>
      {:else if preview}
        <div class="prompt-debug__section">
          <strong>Finaler Prompt</strong>
          <pre class="prompt-debug__code">{preview.promptText}</pre>
        </div>

        <div class="prompt-debug__section">
          <strong>Nutzereingabe</strong>
          <div class="prompt-debug__list">
            <div class="prompt-debug__item">
              <div class="prompt-debug__item-head">
                <span>Roh</span>
              </div>
              <p>{preview.instructionDebug.rawInput || 'keine'}</p>
            </div>
            <div class="prompt-debug__item">
              <div class="prompt-debug__item-head">
                <span>Normalisierte Liste</span>
              </div>
              {#if preview.instructionDebug.normalizedLines.length}
                <ul class="prompt-debug__bullet-list">
                  {#each preview.instructionDebug.normalizedLines as line}
                    <li>{line}</li>
                  {/each}
                </ul>
              {:else}
                <p>keine zusätzlichen Anforderungen</p>
              {/if}
            </div>
          </div>
        </div>

        <div class="prompt-debug__section">
          <strong>Preset-Wirkung</strong>
          <div class="prompt-debug__list">
            {#if preview.presetEffects.length === 0}
              <p class="muted">
                Für diesen Modus werden keine separaten Stil- oder Licht-Presets verwendet.
              </p>
            {:else}
              {#each preview.presetEffects as effect}
                <div class="prompt-debug__item">
                  <div class="prompt-debug__item-head">
                    <span>{effect.label}</span>
                    <span class="prompt-debug__badge">{effect.value}</span>
                  </div>
                  <p>{effect.appliedFragment}</p>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <div class="prompt-debug__section">
          <strong>Schutzregeln</strong>
          <div class="prompt-debug__list">
            {#each preview.protectionRules as rule}
              <div class="prompt-debug__item">
                <div class="prompt-debug__item-head">
                  <span>{rule.label}</span>
                  <span
                    class:prompt-debug__badge={true}
                    class:prompt-debug__badge--muted={!rule.enabled}
                  >
                    {rule.enabled ? 'aktiv' : 'deaktiviert'}
                  </span>
                </div>
                <p>{rule.appliedFragment ?? 'Keine eigene Prompt-Zeile aktiv.'}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="prompt-debug__section">
          <strong>Prompt-Bausteine</strong>
          <div class="prompt-debug__meta-grid">
            {#each preview.modeParameters as entry}
              <div class="prompt-debug__meta-item">
                <span class="muted">{entry.label}</span>
                <strong>{entry.value}</strong>
              </div>
            {/each}
          </div>
        </div>

        <div class="prompt-debug__section">
          <strong>Request-Modellierung</strong>
          <div class="prompt-debug__meta-grid">
            <div class="prompt-debug__meta-item">
              <span class="muted">Provider</span>
              <strong>{preview.requestPreview.provider}</strong>
            </div>
            <div class="prompt-debug__meta-item">
              <span class="muted">Modell</span>
              <strong>{preview.requestPreview.model}</strong>
            </div>
            <div class="prompt-debug__meta-item">
              <span class="muted">Konfiguriert</span>
              <strong>{preview.requestPreview.configured ? 'ja' : 'nein'}</strong>
            </div>
            <div class="prompt-debug__meta-item">
              <span class="muted">Projekt-ID</span>
              <strong>{preview.requestPreview.projectId}</strong>
            </div>
            <div class="prompt-debug__meta-item">
              <span class="muted">Quellbild-ID</span>
              <strong>{preview.requestPreview.sourceImageId}</strong>
            </div>
            <div class="prompt-debug__meta-item">
              <span class="muted">Varianten</span>
              <strong>{preview.requestPreview.variantsRequested}</strong>
            </div>
            <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
              <span class="muted">Zielregion</span>
              <strong>
                {#if preview.requestPreview.placement}
                  {preview.requestPreview.placement.roomImageId} · x={preview.requestPreview
                    .placement.x}, y={preview.requestPreview.placement.y}, w={preview.requestPreview
                    .placement.width}, h={preview.requestPreview.placement.height}
                {:else}
                  keine
                {/if}
              </strong>
            </div>
          </div>
        </div>

        <div class="prompt-debug__section">
          <strong>Provider-Debug</strong>
          <div class="prompt-debug__list">
            <div class="prompt-debug__item">
              <div class="prompt-debug__item-head">
                <span>Geplanter Request</span>
                <span class="prompt-debug__badge">
                  {preview.providerDebug.request.plannedFlow}
                </span>
              </div>
              <div class="prompt-debug__meta-grid">
                <div class="prompt-debug__meta-item">
                  <span class="muted">Modus</span>
                  <strong>{preview.providerDebug.request.mode}</strong>
                </div>
                <div class="prompt-debug__meta-item">
                  <span class="muted">Modell</span>
                  <strong>{preview.providerDebug.request.model}</strong>
                </div>
                <div class="prompt-debug__meta-item">
                  <span class="muted">Typ</span>
                  <strong>{preview.providerDebug.request.requestType}</strong>
                </div>
                <div class="prompt-debug__meta-item">
                  <span class="muted">Endpoint</span>
                  <strong>{preview.providerDebug.request.requestEndpoint}</strong>
                </div>
                <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                  <span class="muted">Run-ID</span>
                  <strong>{preview.providerDebug.request.runId}</strong>
                </div>
                <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                  <span class="muted">Endpoint-URL</span>
                  <strong>{preview.providerDebug.request.endpointUrl ?? 'keine'}</strong>
                </div>
                <div class="prompt-debug__meta-item">
                  <span class="muted">Quellbild an Provider</span>
                  <strong
                    >{preview.providerDebug.request.sourceImageIncluded ? 'ja' : 'nein'}</strong
                  >
                </div>
                <div class="prompt-debug__meta-item">
                  <span class="muted">Maske / Zielregion</span>
                  <strong>
                    {preview.providerDebug.request.maskIncluded ? 'Maske' : 'keine Maske'}
                    {#if preview.providerDebug.request.targetRegionIncluded}
                      {' · Zielregion'}
                    {/if}
                  </strong>
                </div>
                <div class="prompt-debug__meta-item">
                  <span class="muted">Varianten</span>
                  <strong>{preview.providerDebug.request.sampleCount}</strong>
                </div>
                <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                  <span class="muted">Edit-Strategie</span>
                  <strong>{preview.providerDebug.request.editStrategy}</strong>
                </div>
                <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                  <span class="muted">Negative Prompt</span>
                  <strong>{preview.providerDebug.request.negativePromptText ?? 'keiner'}</strong>
                </div>
              </div>
              <div class="prompt-debug__list">
                <div class="prompt-debug__item">
                  <div class="prompt-debug__item-head">
                    <span>Quellbild-Transfer</span>
                  </div>
                  <p>
                    MIME: {preview.providerDebug.request.sourceImage?.mimeType ?? 'keine Angabe'}
                    · Bytes: {preview.providerDebug.request.sourceImage?.byteLength ?? 'keine'} · SHA-256:
                    {preview.providerDebug.request.sourceImage?.sha256 ?? 'keine'}
                  </p>
                  <p>
                    Base64: {formatBase64Summary(preview.providerDebug.request.sourceImage?.base64)}
                  </p>
                </div>
                <div class="prompt-debug__item">
                  <div class="prompt-debug__item-head">
                    <span>Masken-Transfer</span>
                  </div>
                  <p>
                    {#if preview.providerDebug.request.maskImage}
                      MIME: {preview.providerDebug.request.maskImage.mimeType ?? 'keine Angabe'} · Bytes:
                      {preview.providerDebug.request.maskImage.byteLength ?? 'keine'} · SHA-256: {preview
                        .providerDebug.request.maskImage.sha256 ?? 'keine'}
                    {:else}
                      Keine Maske im Request.
                    {/if}
                  </p>
                  {#if preview.providerDebug.request.maskImage}
                    <p>
                      Base64:
                      {formatBase64Summary(preview.providerDebug.request.maskImage.base64)}
                    </p>
                  {/if}
                </div>
              </div>
              {#if preview.providerDebug.request.fallbackReason}
                <p>Geplanter Fallback-Grund: {preview.providerDebug.request.fallbackReason}</p>
              {/if}
              {#if preview.providerDebug.request.modelHint}
                <p>Modell-Hinweis: {preview.providerDebug.request.modelHint}</p>
              {/if}
              <pre class="prompt-debug__code">{JSON.stringify(
                  preview.providerDebug.request.requestBody,
                  null,
                  2
                )}</pre>
            </div>

            <div class="prompt-debug__item">
              <div class="prompt-debug__item-head">
                <span>Letzter Run</span>
                <span
                  class:prompt-debug__badge={true}
                  class:prompt-debug__badge--muted={!preview.providerDebug.run}
                >
                  {preview.providerDebug.run ? preview.providerDebug.run.usedFlow : 'noch keiner'}
                </span>
              </div>

              {#if preview.providerDebug.run}
                <div class="prompt-debug__meta-grid">
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Run-ID</span>
                    <strong>{preview.providerDebug.run.runId}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Tatsaechlicher Flow</span>
                    <strong>{preview.providerDebug.run.usedFlow}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Modell</span>
                    <strong>{preview.providerDebug.run.model}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Request-Typ</span>
                    <strong>{preview.providerDebug.run.requestType}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Endpoint</span>
                    <strong>{preview.providerDebug.run.requestEndpoint}</strong>
                  </div>
                  <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                    <span class="muted">Endpoint-URL</span>
                    <strong>{preview.providerDebug.run.endpointUrl ?? 'keine Angabe'}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Quellbild an Provider</span>
                    <strong>{preview.providerDebug.run.sourceImageIncluded ? 'ja' : 'nein'}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Maske / Zielregion</span>
                    <strong>
                      {preview.providerDebug.run.maskIncluded ? 'Maske' : 'keine Maske'}
                      {#if preview.providerDebug.run.targetRegionIncluded}
                        {' · Zielregion'}
                      {/if}
                    </strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Predictions</span>
                    <strong>{preview.providerDebug.run.predictionsCount ?? 'keine Angabe'}</strong>
                  </div>
                  <div class="prompt-debug__meta-item">
                    <span class="muted">Output-Bytes gesamt</span>
                    <strong>{preview.providerDebug.run.totalOutputBytes ?? 'keine Angabe'}</strong>
                  </div>
                  <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                    <span class="muted">Response-Root-Keys</span>
                    <strong>
                      {#if preview.providerDebug.run.responseRootKeys.length}
                        {preview.providerDebug.run.responseRootKeys.join(', ')}
                      {:else}
                        keine Angabe
                      {/if}
                    </strong>
                  </div>
                  <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                    <span class="muted">Output-MIME-Types</span>
                    <strong>
                      {#if preview.providerDebug.run.outputMimeTypes.length}
                        {preview.providerDebug.run.outputMimeTypes.join(', ')}
                      {:else}
                        keine Angabe
                      {/if}
                    </strong>
                  </div>
                  <div class="prompt-debug__meta-item prompt-debug__meta-item--wide">
                    <span class="muted">Output-Bytegroessen</span>
                    <strong>
                      {#if preview.providerDebug.run.outputByteSizes.length}
                        {preview.providerDebug.run.outputByteSizes.join(', ')}
                      {:else}
                        keine Angabe
                      {/if}
                    </strong>
                  </div>
                </div>

                {#if preview.providerDebug.run.fakeFallbackUsed}
                  <p>
                    Fake-Fallback: {preview.providerDebug.run.fallbackReason ?? 'ohne Grundangabe'}
                  </p>
                {/if}
                {#if preview.providerDebug.run.modelHint}
                  <p>Modell-Hinweis: {preview.providerDebug.run.modelHint}</p>
                {/if}
                {#if preview.providerDebug.run.error}
                  <p>Provider-Fehler: {preview.providerDebug.run.error}</p>
                {/if}
                {#if preview.providerDebug.run.rawResponsePreview}
                  <pre class="prompt-debug__code">{preview.providerDebug.run
                      .rawResponsePreview}</pre>
                {/if}
                {#if preview.providerDebug.run.predictions.length}
                  <div class="prompt-debug__list">
                    {#each preview.providerDebug.run.predictions as prediction}
                      <div class="prompt-debug__item">
                        <div class="prompt-debug__item-head">
                          <span>Prediction #{prediction.index + 1}</span>
                          <span
                            class:prompt-debug__badge={true}
                            class:prompt-debug__badge--muted={!prediction.decodeSucceeded}
                          >
                            {prediction.decodeSucceeded ? 'decoded' : 'fehler'}
                          </span>
                        </div>
                        <p>
                          Felder: {prediction.fieldsPresent.join(', ')} · Bildfeld:
                          {prediction.selectedImageField ?? 'keins'} · MIME:
                          {prediction.mimeType ?? 'keine Angabe'}
                        </p>
                        <p>Base64: {formatBase64Summary(prediction.base64)}</p>
                        <p>
                          Decoded Bytes: {prediction.decodedByteLength ?? 'keine'} · SHA-256:
                          {prediction.sha256 ?? 'keine'}
                        </p>
                        {#if prediction.decodeError}
                          <p>Decode-Fehler: {prediction.decodeError}</p>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
                {#if preview.providerDebug.run.persistedImages.length}
                  <div class="prompt-debug__section">
                    <strong>Speicherung und Anzeige</strong>
                    <div class="prompt-debug__list">
                      {#each preview.providerDebug.run.persistedImages as image}
                        <div class="prompt-debug__item">
                          <div class="prompt-debug__item-head">
                            <span>Bild {image.imageId}</span>
                            <span class="prompt-debug__badge">
                              {image.storedMatchesProvider === true
                                ? 'Provider = gespeichert'
                                : image.storedMatchesProvider === false
                                  ? 'Hash-Abweichung'
                                  : 'kein Providervergleich'}
                            </span>
                          </div>
                          <p>Datei: {image.relativeFilePath}</p>
                          <p>Thumbnail: {image.relativeThumbnailPath ?? 'keins'}</p>
                          <p>
                            Editor: {image.editorUrl} · Anzeige:
                            {image.displayedViaDownloadRoute}
                          </p>
                          <p>
                            Download: {image.downloadUrl} · MIME: {image.mimeType} · Bytes:
                            {image.storedByteLength ?? 'keine'}
                          </p>
                          <p>
                            Provider SHA-256: {image.providerOutputSha256 ?? 'keine'} · Stored SHA-256:
                            {image.storedSha256 ?? 'keine'} · Displayed SHA-256:
                            {image.displayedOutputSha256 ?? 'keine'}
                          </p>
                          {#if image.storedMatchesProviderReason}
                            <p>Abweichungsgrund: {image.storedMatchesProviderReason}</p>
                          {/if}
                          {#if image.storageTransform}
                            <pre class="prompt-debug__code">{JSON.stringify(
                                image.storageTransform,
                                null,
                                2
                              )}</pre>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
                {#if preview.providerDebug.run.artifacts.length}
                  <div class="prompt-debug__section">
                    <strong>Debug-Artefakte</strong>
                    <div class="prompt-debug__list">
                      {#each preview.providerDebug.run.artifacts as artifact}
                        <div class="prompt-debug__item">
                          <div class="prompt-debug__item-head">
                            <span>{artifact.label}</span>
                          </div>
                          <p>
                            {artifact.relativePath} · MIME: {artifact.mimeType ?? 'keine'} · Bytes:
                            {artifact.byteLength ?? 'keine'} · SHA-256:
                            {artifact.sha256 ?? 'keine'}
                          </p>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
                {#if preview.providerDebug.run.responseMetadata}
                  <pre class="prompt-debug__code">{JSON.stringify(
                      preview.providerDebug.run.responseMetadata,
                      null,
                      2
                    )}</pre>
                {/if}
              {:else}
                <p>Nach einer Generierung erscheinen hier Flow-, Response- und Fallback-Details.</p>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <p class="muted">{emptyMessage}</p>
      {/if}
    </div>
  </details>
</Card>

<style>
  .prompt-debug {
    display: grid;
    gap: 0;
  }

  .prompt-debug__summary {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    list-style: none;
    padding: 18px var(--space-4);
  }

  .prompt-debug__summary::-webkit-details-marker {
    display: none;
  }

  .prompt-debug__summary-copy {
    display: grid;
    gap: 4px;
  }

  .prompt-debug__summary-copy small {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .prompt-debug__indicator {
    border-bottom: 2px solid var(--color-text);
    border-right: 2px solid var(--color-text);
    height: 10px;
    transform: rotate(45deg);
    transition: transform 120ms ease;
    width: 10px;
  }

  .prompt-debug[open] .prompt-debug__indicator {
    transform: rotate(225deg);
  }

  .prompt-debug__body {
    display: grid;
    gap: var(--space-4);
    padding: 0 var(--space-4) var(--space-4);
  }

  .prompt-debug__section {
    display: grid;
    gap: var(--space-2);
  }

  .prompt-debug__section + .prompt-debug__section {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-3);
  }

  .prompt-debug__code {
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    margin: 0;
    overflow-x: auto;
    padding: var(--space-3);
    white-space: pre-wrap;
  }

  .prompt-debug__list {
    display: grid;
    gap: var(--space-2);
  }

  .prompt-debug__item {
    display: grid;
    gap: 6px;
  }

  .prompt-debug__item + .prompt-debug__item {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-2);
  }

  .prompt-debug__item p {
    color: var(--color-text-muted);
    margin: 0;
  }

  .prompt-debug__bullet-list {
    color: var(--color-text-muted);
    display: grid;
    gap: 6px;
    margin: 0;
    padding-left: 20px;
  }

  .prompt-debug__item-head {
    align-items: center;
    display: flex;
    gap: var(--space-2);
    justify-content: space-between;
  }

  .prompt-debug__badge {
    background: rgba(0, 87, 184, 0.1);
    border-radius: 999px;
    color: var(--color-blue);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 5px 10px;
  }

  .prompt-debug__badge--muted {
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
  }

  .prompt-debug__meta-grid {
    display: grid;
    gap: var(--space-2);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .prompt-debug__meta-item {
    display: grid;
    gap: 4px;
  }

  .prompt-debug__meta-item strong {
    overflow-wrap: anywhere;
  }

  .prompt-debug__meta-item--wide {
    grid-column: 1 / -1;
  }

  .prompt-debug__error {
    color: var(--color-red);
    margin: 0;
  }

  @media (max-width: 720px) {
    .prompt-debug__meta-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
