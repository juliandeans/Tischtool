<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import PresetSelect from '$lib/components/presets/PresetSelect.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let stylePreset = 'editorial';
  let lightPreset = 'tageslicht';
  let presetName = 'Wohnlich Tageslicht';
</script>

<div class="page-header">
  <span class="eyebrow">Presets</span>
  <h1>Preset-Verwaltung</h1>
  <p>
    Seedbare Stil- und Lichtvorgaben sind visuell vorbereitet. Persistenz und echte Preset-Daten
    folgen später.
  </p>
</div>

<div class="stack">
  <Card accent="yellow">
    <div class="stack">
      <Input bind:value={presetName} id="preset-name" label="Preset-Name" />
      <PresetSelect
        bind:value={stylePreset}
        id="preset-style"
        label="Stil-Preset"
        description="Empfohlene Seed-Werte aus 21_ENV_AND_SETUP.md."
      />
      <PresetSelect bind:value={lightPreset} id="preset-light" label="Licht-Preset" />
      <div class="cluster">
        <Button variant="primary" disabled>Preset speichern</Button>
        <Button disabled>Reset</Button>
      </div>
    </div>
  </Card>
</div>
