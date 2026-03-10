<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  export let data;
  export let form;
</script>

<div class="settings-layout">
  {#if data.providerSettings.providerDebugEnabled}
    <Card accent="red">
      <div class="stack settings-card">
        <div class="section-head">
          <h2>Provider-Konfiguration</h2>
          <p>
            Nicht-geheime Vertex-Werte werden serverseitig aus der Umgebung gelesen. Credentials
            bleiben vollständig im Backend.
          </p>
        </div>

        <div class="env-grid">
          <Input
            id="settings-vertex-project-id"
            label="Vertex Project ID"
            value={data.providerSettings.vertexProjectId || 'Nicht gesetzt'}
            readonly
          />
          <Input
            id="settings-vertex-location"
            label="Vertex Location"
            value={data.providerSettings.vertexLocation || 'Nicht gesetzt'}
            readonly
          />
          {#if data.providerSettings.imageModel === 'imagen-3'}
            <Input
              id="settings-vertex-model"
              label="Vertex Model"
              value={data.providerSettings.vertexModel || 'Nicht gesetzt'}
              readonly
            />
          {/if}
        </div>

        <p class="note">{data.credentialsHint}</p>
      </div>
    </Card>
  {/if}

  <Card accent="blue">
    <form class="stack settings-card" method="POST">
      {#if data.providerSettings.providerDebugEnabled}
        <div class="section-head">
          <h2>Betriebsmodus</h2>
          <p>
            Hier schaltest du zwischen Test-/Fallback-Betrieb und echtem Google-Vertex-Betrieb um.
            Die Einstellung gilt für diesen Browser.
          </p>
        </div>

        <div class="mode-grid">
          <label
            class:selected={data.providerSettings.providerPreference === 'fake'}
            class="mode-card"
          >
            <input
              type="radio"
              name="providerPreference"
              value="fake"
              checked={data.providerSettings.providerPreference === 'fake'}
            />
            <span class="mode-card__copy">
              <strong>Test / Fallback</strong>
              <small>
                Nutzt bewusst den bestehenden Dev-Flow ohne echte Bilderzeugung über Google.
              </small>
            </span>
          </label>

          <label
            class:selected={data.providerSettings.providerPreference === 'real'}
            class="mode-card"
          >
            <input
              type="radio"
              name="providerPreference"
              value="real"
              checked={data.providerSettings.providerPreference === 'real'}
            />
            <span class="mode-card__copy">
              <strong>Echter Google-Vertex-Betrieb</strong>
              <small>
                Verwendet für `environment_edit` den echten Vertex-Provider, sofern Konfiguration
                und ADC verfügbar sind.
              </small>
            </span>
          </label>
        </div>

        <p class="note">
          Aktuell gewählt:
          <strong>
            {data.providerSettings.providerPreference === 'real'
              ? 'Echter Google-Vertex-Betrieb'
              : 'Test / Fallback'}
          </strong>
        </p>
      {/if}

      <div class="section-head">
        <h2>Bildgenerierung</h2>
        <p>Hier wählst du das aktive Bildmodell für neue Generierungen.</p>
      </div>

      <Select
        id="settings-image-model"
        name="imageModel"
        label="Modell"
        value={data.providerSettings.imageModel}
        options={[
          { value: 'gemini-3-pro-image', label: 'Gemini 3 Pro Image' },
          {
            value: 'gemini-3.1-flash-image-preview',
            label: 'Gemini 3.1 Flash Image'
          },
          {
            value: 'gemini-2.5-flash-image-preview',
            label: 'Gemini 2.5 Flash Image'
          },
          { value: 'flux-2-pro', label: 'FLUX.2 Pro (BFL)' },
          { value: 'flux-2-pro-preview', label: 'FLUX.2 Pro Preview (BFL)' },
          { value: 'gpt-image-1', label: 'GPT Image 1 (OpenAI)' },
          { value: 'imagen-3', label: 'Imagen 3' }
        ]}
      />

      {#if form?.error}
        <p class="message message--error">{form.error}</p>
      {/if}

      {#if form?.success}
        <p class="message message--success">Settings wurden für diesen Browser gespeichert.</p>
      {/if}

      <label class="toggle">
        <input
          type="checkbox"
          name="providerDebugEnabled"
          checked={data.providerSettings.providerDebugEnabled}
        />
        <span class="toggle__copy">
          <strong>Debugging aktivieren</strong>
          <small>
            Zeigt technische Prompt-, Provider- und Diagnoseinformationen in der App an.
          </small>
        </span>
      </label>

      <div class="cluster">
        <Button type="submit" variant="primary">Settings speichern</Button>
      </div>
    </form>
  </Card>

  {#if data.providerSettings.providerDebugEnabled}
    <Card accent={data.providerStatus.canUseVertex ? 'blue' : 'yellow'}>
      <div class="stack settings-card">
        <div class="section-head">
          <h2>Provider-Status</h2>
          <p>
            Der Status wird serverseitig aus Konfiguration, ADC und aktueller Präferenz ermittelt.
          </p>
        </div>

        <div class="status-grid">
          <div class="status-item">
            <span class="muted">Konfiguration</span>
            <strong>{data.providerStatus.configComplete ? 'vollständig' : 'unvollständig'}</strong>
          </div>
          <div class="status-item">
            <span class="muted">ADC / Server-Auth</span>
            <strong>{data.providerStatus.authAvailable ? 'verfügbar' : 'nicht verfügbar'}</strong>
          </div>
          <div class="status-item">
            <span class="muted">Bevorzugter Flow</span>
            <strong>
              {data.providerStatus.preferredFlow === 'real' ? 'echter Provider' : 'Fake-Flow'}
            </strong>
          </div>
          <div class="status-item">
            <span class="muted">Aktiver Flow</span>
            <strong
              >{data.providerStatus.effectiveFlow === 'vertex' ? 'Vertex' : 'Fake-Fallback'}</strong
            >
          </div>
        </div>

        <div class="status-copy">
          <p class="message message--neutral">{data.providerStatus.statusMessage}</p>
          <p class="muted">{data.providerStatus.authMessage}</p>
          {#if data.providerStatus.fallbackReason}
            <p class="muted">Fallback-Grund: {data.providerStatus.fallbackReason}</p>
          {/if}
          <p class="muted">
            Zuletzt geprüft: {new Date(data.providerStatus.checkedAt).toLocaleString('de-DE')}
          </p>
        </div>

        <div class="cluster">
          <Button href="/api/provider/status" target="_blank" rel="noreferrer" variant="secondary">
            Status-Endpoint öffnen
          </Button>
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  .settings-layout {
    display: grid;
    gap: var(--space-4);
  }

  .settings-card {
    display: grid;
    gap: var(--space-4);
  }

  .stack {
    display: grid;
    gap: var(--space-4);
  }

  .section-head {
    display: grid;
    gap: 8px;
  }

  .section-head h2 {
    font-size: 1.15rem;
    margin: 0;
  }

  .section-head p,
  .note,
  .muted {
    color: var(--color-text-muted);
    margin: 0;
  }

  .env-grid,
  .status-grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .mode-grid {
    display: grid;
    gap: var(--space-3);
  }

  .mode-card {
    align-items: start;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    box-shadow: var(--color-shadow-inset);
    cursor: pointer;
    display: grid;
    gap: 12px;
    grid-template-columns: auto 1fr;
    padding: 14px 16px;
  }

  .mode-card.selected {
    border-color: var(--color-blue);
    background: color-mix(in srgb, var(--color-blue) 6%, white);
  }

  .mode-card input {
    accent-color: var(--color-blue);
    height: 18px;
    margin: 3px 0 0;
    width: 18px;
  }

  .mode-card__copy {
    display: grid;
    gap: 6px;
  }

  .mode-card__copy small {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .toggle {
    align-items: start;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    box-shadow: var(--color-shadow-inset);
    display: grid;
    gap: 12px;
    grid-template-columns: auto 1fr;
    padding: 14px 16px;
  }

  .toggle input {
    accent-color: var(--color-blue);
    height: 18px;
    margin: 3px 0 0;
    width: 18px;
  }

  .toggle__copy {
    display: grid;
    gap: 6px;
  }

  .toggle__copy small {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .status-item,
  .status-copy {
    display: grid;
    gap: 6px;
  }

  .message {
    border-radius: var(--radius-card);
    margin: 0;
    padding: 12px 14px;
  }

  .message--success {
    background: color-mix(in srgb, var(--color-blue) 10%, white);
  }

  .message--error {
    background: color-mix(in srgb, var(--color-red) 10%, white);
    color: var(--color-red);
  }

  .message--neutral {
    background: color-mix(in srgb, var(--color-yellow) 16%, white);
  }

  .cluster {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
</style>
