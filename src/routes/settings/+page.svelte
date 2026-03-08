<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  export let data;
  export let form;

  const providerPreferenceOptions = [
    { value: 'real', label: 'Echter Provider bevorzugt' },
    { value: 'fake', label: 'Fake-Flow bevorzugt' }
  ];
</script>

<div class="settings-layout">
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
        <Input
          id="settings-vertex-model"
          label="Vertex Model"
          value={data.providerSettings.vertexModel || 'Nicht gesetzt'}
          readonly
        />
      </div>

      <p class="note">{data.credentialsHint}</p>
    </div>
  </Card>

  <Card accent="blue">
    <form class="stack settings-card" method="POST">
      <div class="section-head">
        <h2>Laufzeit-Präferenzen</h2>
        <p>Diese Einstellungen gelten nur für den aktuellen Browser und steuern den MVP-Flow.</p>
      </div>

      <Select
        id="settings-provider-preference"
        name="providerPreference"
        label="Provider-Modus"
        value={data.providerSettings.providerPreference}
        options={providerPreferenceOptions}
      />

      <label class="toggle">
        <input
          type="checkbox"
          name="providerDebugEnabled"
          checked={data.providerSettings.providerDebugEnabled}
        />
        <span class="toggle__copy">
          <strong>Prompt- und Provider-Debug bevorzugen</strong>
          <small>Bereitet eine ausführlichere technische Sicht für die nächsten Schritte vor.</small
          >
        </span>
      </label>

      {#if form?.error}
        <p class="message message--error">{form.error}</p>
      {/if}

      {#if form?.success}
        <p class="message message--success">Settings wurden für diesen Browser gespeichert.</p>
      {/if}

      <div class="cluster">
        <Button type="submit" variant="primary">Settings speichern</Button>
      </div>
    </form>
  </Card>

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
