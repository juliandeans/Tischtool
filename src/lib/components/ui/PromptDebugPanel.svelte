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
