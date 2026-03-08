<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  let appName = 'Moebel Visualisierung';
  let storageDriver = 'local';
  let storageBasePath = './data';
</script>

<div class="page-header">
  <span class="eyebrow">Settings</span>
  <h1>Lokale Grundeinstellungen</h1>
  <p>
    Die Seite spiegelt die dokumentierten Umgebungswerte wider, ohne bereits Konfigurationen zu
    speichern oder Backend-Logik anzustoßen.
  </p>
</div>

<Card accent="red">
  <div class="stack">
    <Input bind:value={appName} id="settings-app-name" label="App-Name" />
    <Select
      bind:value={storageDriver}
      id="settings-storage-driver"
      label="Storage Driver"
      options={[
        { value: 'local', label: 'local' },
        { value: 's3', label: 's3' }
      ]}
    />
    <Input bind:value={storageBasePath} id="settings-storage-base-path" label="Storage Base Path" />
    <div class="cluster">
      <Button variant="primary" disabled>Änderungen speichern</Button>
      <Button disabled>.env folgt später</Button>
    </div>
  </div>
</Card>
